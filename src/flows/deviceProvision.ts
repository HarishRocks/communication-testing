// DEVICE_CONFIRM_FOR_DFU_MODE not used
import axios from 'axios';

import config from '../config/constants';
import { createPort, openConnection, closeConnection } from '../core/port';
import { sendData } from '../core/sendData';
import { receiveCommand } from '../core/recieveData';
import { getKeysFromSeed, calculatePathFromIndex } from '../utils/crypto';
import { intToUintByte } from '../bytes';

const cyBaseURL = 'https://api.cypherock.com';

const sleep = (ms: any) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const getProvisionIndex = async (serial: string) => {
  const res = await axios.post(`${cyBaseURL}/provision/index`, {
    type: 'DEVICE',
    serial,
  });

  console.log('Response from server:');
  console.log(res.data);

  if (res.data.status !== 1) {
    throw new Error('Server responded in error');
  }

  return res.data.data.index;
};

const provisionDevice = async (serial: string, publicKey: string) => {
  const res = await axios.post(`${cyBaseURL}/provision/index/add`, {
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

const deviceProvision = async () => {
  const { connection } = await createPort();
  try {
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

    console.log('From Device: Serial:');
    console.log({ serialNumber });
    if (serialNumber.search(/[^0]/) === -1) {
      throw new Error('Device returned invalid serial or public key');
    }

    const index = await getProvisionIndex(serialNumber);

    if (index === undefined || index === null) {
      console.log('Invalid index from server: ', index);
      return 0;
    }

    const calculatedPath = calculatePathFromIndex(index);

    const deviceNfcKeys = await getKeysFromSeed(
      config.SECRET_SEED,
      `m/1000'/1'/2'/0/${calculatedPath.path}`,
      'nist256p1'
    );
    const cardNfcKeys = await getKeysFromSeed(
      config.SECRET_SEED,
      `m/1000'/0'/2'/0`,
      'nist256p1'
    );
    const deviceAuthKeys = await getKeysFromSeed(
      config.SECRET_SEED,
      `m/1000'/1'/0'/0/${calculatedPath.path}`,
      'nist256p1'
    );

    const keysData =
      deviceAuthKeys.privateKey +
      deviceAuthKeys.publicKey +
      intToUintByte(calculatedPath.firstIndex, 4 * 8) + // 4 Bytes index
      intToUintByte(calculatedPath.secondIndex, 4 * 8) + // 4 Bytes index
      deviceNfcKeys.privateKey +
      cardNfcKeys.xpub;

    await sendData(connection, 84, '02' + keysData); // Add date: DMY
    await sleep(200);

    const isSuccess = await receiveCommand(connection, 84);

    if (!isSuccess.startsWith('01')) {
      throw new Error('Failed to provision device.');
    }

    await provisionDevice(serialNumber, deviceAuthKeys.fullPublicKey);
    console.log('Device provisioned successfully.');

    await sleep(2000);
  } catch (error) {
    console.log(error);
    await sleep(2000);
  } finally {
    await closeConnection(connection);
    console.log('close');
  }
};

export default deviceProvision;
