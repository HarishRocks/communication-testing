import { createPort, openConnection, closeConnection } from '../core/port';
import { sendData } from '../core/sendData';
import { coins as COINS } from '../config';
import { receiveCommand } from '../core/recieveData';
import { default as base58 } from 'bs58';
import { default as Datastore } from 'nedb';
import deviceReady from '../core/deviceReady';
import axios from 'axios';

const nulldata = '00000000';
export const cyBaseURL =
  'http://cypherockserver-env.eba-hvatxy8g.ap-south-1.elasticbeanstalk.com';

export const generateSerialNumber = async () => {
  const res: any = await axios.get(`${cyBaseURL}/generateserialnumber`);
  console.log('Res ' + res);
  console.log('Serial Number recieved from server : ' + res.data);
  return res.data;
};

export const uploadPublicKey = async (serial: any, publicKey: any) => {
  const res = await axios.post(`${cyBaseURL}/provision/add`, {
    type: 'DEVICE',
    serial,
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
  await openConnection(connection);

  // const ready = await deviceReady(connection);
  const ready = 1;
  // Only if device is ready.
  if (ready) {
    console.log(`Desktop : Requesting Provision Status.`);

    await sendData(connection, 20, nulldata);

    const provisionStatus: any = !!Number(await receiveCommand(connection, 21));
    console.log('From Device : Provision status: ' + provisionStatus);

    if (provisionStatus) {
      console.log('Device already provisioned.\nExiting Function...');
      return 0;
    }

    const serialNumber = await generateSerialNumber();

    await sendData(connection, 22, serialNumber);

    const publicKey = await receiveCommand(connection, 25);

    await uploadPublicKey(serialNumber, publicKey);

    if (!uploadPublicKey) {
      console.log('Upload failed. Try again.\nExiting function..');
      return 0;
    }

    await sendData(connection, 26, '00000001');

    const lockStatus = await receiveCommand(connection, 27);
    console.log('lockStatus ' + lockStatus);
    // if(!Number(lockStatus)){
    //     console.log("Locking unsuccessful, Try again.\nExiting function..");
    //     deletePublicKey(serialNumber, publicKey);
    //     return 0;
    // }
  } else {
    console.log('Device not ready');
  }

  await closeConnection(connection);
  connection.on('error', (d) => {
    console.log(d);
  });
};
