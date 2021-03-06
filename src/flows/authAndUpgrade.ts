// DEVICE_CONFIRM_FOR_DFU_MODE not used
import { createPort, openConnection, closeConnection } from '../core/port';
import { sendData } from '../core/sendData';
import { recieveData, receiveCommand } from '../core/recieveData';
import {
  getAccessToken,
  getRandomNumFromServer,
  verifySignedChallenge,
} from './auth';
import axios from 'axios';
import {
  DfuUpdates,
  DfuTransportSerial,
  DfuOperation,
  //@ts-ignore
} from 'pc-nrf-dfu-js';

const sleep = (ms: any) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const nulldata = '00000000';

const upgrade = async (connection: any) => {
  const updates = await DfuUpdates.fromZipFilePath('./app_dfu_package.zip');
  // Create DfuTransportSerial
  const serialTransport = new DfuTransportSerial(connection, 16);

  // Create DfuOperation
  const dfu = new DfuOperation(updates, serialTransport);
  // Start dfu
  console.log('writing upgrade');
  dfu
    .start(true)
    .then(() => {
      console.log('complete');
    })
    .catch(async (e: any) => {
      console.log(e);
      console.log('waiting before retry');
      await sleep(2000);
      console.log('retrying now');
      connection.close(() => {
        upgrade(connection);
      });
    });
};

const recieveFirmware = (connection: any) => {
  return new Promise((resolve, reject) => {
    receiveCommand(connection, 15).then((res) => {
      resolve(res);
    });
    sendData(connection, 14, nulldata);
  });
};

export const onlyUpgrade = async () => {
  // will get xPub from wallet_id and the coin_type

  const { connection } = await createPort();
  upgrade(connection);
};

export const deviceAuthandUpgrade = async () => {
  // will get xPub from wallet_id and the coin_type

  const { connection, serial } = await createPort();
  await openConnection(connection);

  // await sendData(connection , IN_BOOTLOADER_MODE, "00");

  // const bootloaderMode = receiveCommand(connection, BOOTLOADER_STATUS)
  const bootloaderMode = '01';
  if (!parseInt(bootloaderMode, 10)) {
    console.log('Device not in bootloader mode.\nExiting function...');
    return 0;
  }

  // await sendData(connection, START_AUTH_FLOW, "00");

  // const authFlowStatus = receiveCommand(connection, BOOTLOADER_STATUS)
  const authFlowStatus = '01';
  if (!parseInt(authFlowStatus, 10)) {
    console.log('Device denied Start Auth flow.\nExiting function...');
    // return 0;
  }

  await sendData(connection, 23, nulldata);

  const serialNumber = await receiveCommand(connection, 24);
  console.log('From Device: Serial number: ' + serialNumber);

  await sendData(connection, 12, nulldata);

  const signature = await receiveCommand(connection, 13);
  console.log('Signature : ' + signature);

  const accessToken = await getAccessToken(serialNumber, signature);
  console.log('here');

  // await sendData(connection, 14, nulldata);

  const firmwareVersion = await recieveFirmware(connection);
  console.log('From Device: Firmware Version: ' + firmwareVersion);

  // const firmwareVersion = 1;

  const randomNumber = await getRandomNumFromServer(
    serialNumber,
    firmwareVersion
  );

  await sendData(connection, 16, randomNumber);

  const signedChallenge = await receiveCommand(connection, 17);

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

  await sendData(connection, 18, '00000002');

  const upgradeFirmwareResponse = await receiveCommand(connection, 29);
  if (!Number(upgradeFirmwareResponse)) {
    console.log(
      'From Device: User Rejected Upgrade Request.\nExiting Function...'
    );
    return 0;
  }

  connection.flush();

  await closeConnection(connection);
  console.log('close');

  await sleep(5000);
  upgrade(connection);
};
