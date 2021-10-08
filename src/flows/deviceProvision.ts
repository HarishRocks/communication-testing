// DEVICE_CONFIRM_FOR_DFU_MODE not used
import axios from 'axios';

import config from '../config/constants';
import { createPort, openConnection, closeConnection } from '../core/port';
import { sendData } from '../core/sendData';
import { receiveCommand } from '../core/recieveData';
import { getKeysFromSeed, calculatePathFromIndex } from '../utils/crypto';
import { intToUintByte } from '../bytes';

const cyBaseURL =
  'http://cypherockserver-env.eba-hvatxy8g.ap-south-1.elasticbeanstalk.com';

const sleep = (ms: any) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const provisionDevice = async (serial: string, publicKey: string) => {
  const res = await axios.post(`${cyBaseURL}/provision/add`, {
    type: 'DEVICE',
    serial,
    publicKey,
  });

  console.log('Response from server:');
  console.log(res.data);

  if (res.data.status !== 1) {
    throw new Error('Server responded in error');
  }
};

let index = 0;

const deviceProvision = async () => {
  const { connection } = await createPort();
  await openConnection(connection);
  const date = new Date();

  const day = date.getDate().toString(16);
  const month = (date.getMonth() + 1).toString(16);
  const year = date.getFullYear().toString(16);

  const datePayload =
    day.padStart(2, '0') + month.padStart(2, '0') + year.padStart(4, '0');

  await sendData(connection, 84, '01' + datePayload); // Add date: DMY

  const serialAndKey: string = await receiveCommand(connection, 82);
  const serialNumber = serialAndKey.slice(0, 64).toUpperCase();

  if (index !== undefined || index !== null) {
    console.log('Upload failed. Try again.\nExiting function..');
    return 0;
  }

  const deviceNfcKeys = getKeysFromSeed(
    config.SECRET_SEED,
    `m/1000'/1'/2'/0/${calculatePathFromIndex(index)}`
  );
  const cardNfcKeys = getKeysFromSeed(config.SECRET_SEED, `m/1000'/0'/2'/0`);
  const deviceAuthKeys = getKeysFromSeed(
    config.SECRET_SEED,
    `m/1000'/1'/0'/0/${calculatePathFromIndex(index)}`
  );

  console.log('From Device: Serial and public key:');
  console.log({ serialNumber });
  if (serialNumber.search(/[^0]/) === -1) {
    throw new Error('Device returned invalid serial or public key');
  }

  const keysData =
    deviceAuthKeys.privateKey +
    deviceAuthKeys.publicKey +
    intToUintByte(index, 8 * 8) + // 8 Bytes index
    deviceNfcKeys.privateKey +
    cardNfcKeys.xpub;

  await sendData(connection, 84, '02' + keysData); // Add date: DMY
  await sleep(200);
  const isSuccess = await receiveCommand(connection, 84);

  if (isSuccess.startsWith('01')) {
    console.log('Device provisioned successfully.');
  } else {
    console.log('Failed to provision device.');
  }

  //try {
  //// await provisionDevice(serialNumber, publicKey);
  //await sleep(2000);
  //await sendData(connection, 81, '02');
  //} catch (error) {
  //await sleep(2000);
  //await sendData(connection, 81, '03');
  //console.log(error);
  //} finally {
  //await closeConnection(connection);
  //console.log('close');
  //}
};

export default deviceProvision;
