// DEVICE_CONFIRM_FOR_DFU_MODE not used
import { createPort } from '../core/port';
import { sendData } from '../core/sendData';
import { receiveCommand } from '../core/recieveData';
import axios from 'axios';

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

const deviceProvision = async () => {
  const { connection } = await createPort();
  connection.open();
  const date = new Date();

  const day = date.getDate().toString(16);
  const month = (date.getMonth() + 1).toString(16);
  const year = date.getFullYear().toString(16);

  const datePayload =
    day.padStart(2, '0') + month.padStart(2, '0') + year.padStart(4, '0');

  await sendData(connection, 81, '01' + datePayload); // Add date: DMY

  const serialAndKey: string = await receiveCommand(connection, 82);
  const serialNumber = serialAndKey.slice(0, 64).toUpperCase();
  const publicKey = serialAndKey.slice(64);
  console.log('From Device: Serial and public key:');
  console.log({ serialNumber, publicKey });
  if (serialNumber.search(/[^0]/) === -1 || publicKey.search(/[^0]/) === -1) {
    throw new Error('Device returned invalid serial or public key');
  }

  try {
    await provisionDevice(serialNumber, publicKey);
    await sleep(2000);
    await sendData(connection, 81, '02');
    console.log('Device provisioned successfully.');
  } catch (error) {
    await sleep(2000);
    await sendData(connection, 81, '03');
    console.log(error);
    console.log('Failed to provision device.');
  } finally {
    connection.close(async () => {
      console.log('close');
    });
  }
};

export default deviceProvision;
