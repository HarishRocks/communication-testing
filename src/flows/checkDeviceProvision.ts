// DEVICE_CONFIRM_FOR_DFU_MODE not used
import { createPort, openConnection, closeConnection } from '../core/port';
import { sendData } from '../core/sendData';
import { receiveCommand } from '../core/recieveData';
import axios from 'axios';

const cyBaseURL =
  'http://cypherockserver-env.eba-hvatxy8g.ap-south-1.elasticbeanstalk.com';

const sleep = (ms: any) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const checkDeviceProvisice = async (serial: string) => {
  const res = await axios.post(`${cyBaseURL}/provision/check`, {
    type: 'DEVICE',
    serial,
  });

  console.log('Response from server:');
  console.log(res.data);

  return res.data.status === 1;
};

const checkDeviceProvision = async () => {
  const { connection } = await createPort();
  await openConnection(connection);

  await sendData(connection, 87, '00');
  const data: any = await receiveCommand(connection, 87);
  const isAuthenticated = data.slice(0, 2);
  const serial = data.slice(2);

  console.log('From Device: Is Auth and serial:');
  console.log({ isAuthenticated, serial });
  if (serial.search(/[^0]/) === -1) {
    throw new Error('Device returned invalid serial.');
  }

  try {
    const isProvisioned = await checkDeviceProvisice(serial);
    if (isProvisioned) {
      console.log('Device is provisioned.');
    } else {
      console.log('Device is not provisioned.');
    }
  } catch (error) {
    console.log(error);
    console.log('Failed to check device provision.');
  } finally {
    await closeConnection(connection);
  }
};

export default checkDeviceProvision;
