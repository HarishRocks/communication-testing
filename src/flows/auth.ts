// DEVICE_CONFIRM_FOR_DFU_MODE not used
import { createPort } from '../communication/port';
import { sendData } from '../communication/sendData';
import { coins as COINS } from '../config';
import { recieveData, recieveCommand } from '../communication/recieveData';
import { getXpubFromWallet, Wallet, pinSetWallet } from './wallet';
import { default as base58 } from 'bs58';
import { default as Datastore } from 'nedb';
import deviceReady from '../communication/deviceReady';
import { query_input, query_number, query_list } from './cli_input';
import axios from 'axios';

const nulldata = '00000000';
export const cyBaseURL = 'http://3.6.66.118';

export const getAccessToken = async (serialNumber: any, signature: any) => {
  const res: any = await axios.post(`${cyBaseURL}/auth/login`, {
    serialNumber,
    signature,
  });

  console.log('autheticated');
  const accessToken = res.data.token;
  axios.defaults.headers.common.Authorization = `Bearer ${accessToken}`;

  return accessToken;
};

export const getRandomNumFromServer = async (
  serialNumber: any,
  firmwareVersion: any
) => {
  const res: any = await axios.post(`${cyBaseURL}/randomNumber`, {
    serialNumber,
    firmwareVersion,
  });

  const randomNumber = res.data;
  return randomNumber;
};

export const verifySignedChallenge = async (
  serialNumber: any,
  signedChallenge: any,
  firmwareVersion: any
) => {
  const res: any = await axios.post(`${cyBaseURL}/verify`, {
    serialNumber,
    signature: signedChallenge,
    firmwareVersion,
  });

  if (res.data) {
    return 1;
  } else {
    return 0;
  }
};

export const deviceAuth = async () => {
  // will get xPub from wallet_id and the coin_type

  const { connection, serial } = await createPort();
  connection.open();

  // await sendData(connection , IN_BOOTLOADER_MODE, "00");

  // const bootloaderMode = recieveCommand(connection, BOOTLOADER_STATUS)
  const bootloaderMode = '01';
  if (!parseInt(bootloaderMode, 10)) {
    console.log('Device not in bootloader mode.\nExiting function...');
    return 0;
  }

  // await sendData(connection, START_AUTH_FLOW, "00");

  // const authFlowStatus = recieveCommand(connection, BOOTLOADER_STATUS)
  const authFlowStatus = '01';
  if (!parseInt(authFlowStatus, 10)) {
    console.log('Device denied Start Auth flow.\nExiting function...');
    // return 0;
  }

  await sendData(connection, 23, nulldata);

  const serialNumber = await recieveCommand(connection, 24);
  console.log('From Device: Serial number: ' + serialNumber);

  await sendData(connection, 12, nulldata);

  const signature = await recieveCommand(connection, 13);

  const accessToken = await getAccessToken(serialNumber, signature);

  await sendData(connection, 14, nulldata);

  const firmwareVersion = await recieveCommand(connection, 15);
  console.log('From Device: Firmware Version: ' + firmwareVersion);

  const randomNumber = await getRandomNumFromServer(
    serialNumber,
    firmwareVersion
  );

  await sendData(connection, 16, randomNumber);

  const signedChallenge = await recieveCommand(connection, 17);

  const verified = await verifySignedChallenge(
    serialNumber,
    signedChallenge,
    firmwareVersion
  );

  if (!verified) {
    console.log('Not verified from the server.\nExiting function...');
    return 0;
  }
  console.log('\nVerified by server.\n');

  return 1;
};
