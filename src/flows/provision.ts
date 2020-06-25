import { createPort } from '../communication/port';
import { sendData } from '../communication/sendData';
import { coins as COINS } from '../config';
import { recieveCommand } from '../communication/recieveData';
import { default as base58 } from 'bs58';
import { default as Datastore } from 'nedb';
import deviceReady from '../communication/deviceReady';
import { query_input, query_number, query_list } from './cli_input';
const axios = require('axios');

const nulldata = '00000000';
export const cyBaseURL = 'http://3.6.66.118';

export const generateSerialNumber = async () => {
  const res: any = await axios.get(`${cyBaseURL}/generateserialnumber`);
  console.log('Res ' + res);
  console.log('Serial Number recieved from server : ' + res.data);
  return res.data;
};

export const uploadPublicKey = async (serialNumber: any, publicKey: any) => {
  const res = await axios.post(`${cyBaseURL}/addDevice`, {
    serialNumber,
    publicKey,
  });

  if (res.data) {
    return 1;
  }
  return 0;
};

// ToDo
export const deletePublicKey = (serialNumber: any, publicKey: any) => {
  return 1;
};

export const provision = async () => {
  const { connection, serial } = await createPort();
  connection.open();

  // const ready = await deviceReady(connection);
  const ready = 1;
  // Only if device is ready.
  if (ready) {
    console.log(`Desktop : Requesting Provision Status.`);

    await sendData(connection, 20, nulldata);

    const provisionStatus: any = !!Number(await recieveCommand(connection, 21));
    console.log('From Device : Provision status: ' + provisionStatus);

    if (provisionStatus) {
      console.log('Device already provisioned.\nExiting Function...');
      return 0;
    }

    const serialNumber = await generateSerialNumber();

    await sendData(connection, 22, serialNumber);

    const publicKey = await recieveCommand(connection, 25);

    await uploadPublicKey(serialNumber, publicKey);

    if (!uploadPublicKey) {
      console.log('Upload failed. Try again.\nExiting function..');
      return 0;
    }

    await sendData(connection, 26, '00000001');

    const lockStatus = await recieveCommand(connection, 27);
    console.log('lockStatus ' + lockStatus);
    // if(!Number(lockStatus)){
    //     console.log("Locking unsuccessful, Try again.\nExiting function..");
    //     deletePublicKey(serialNumber, publicKey);
    //     return 0;
    // }
  } else {
    console.log('Device not ready');
  }

  connection.close();
  connection.on('error', (d) => {
    console.log(d);
  });
};
