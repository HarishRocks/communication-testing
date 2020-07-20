import { createPort } from '../core/port';
import { ackData, sendData } from '../core/sendData';
import { coins as COINS } from '../config';
import { recieveData, receiveCommand } from '../core/recieveData';
import deviceReady from '../core/deviceReady';

const cardAuth = async () => {
  const { connection, serial } = await createPort();
  console.log('Serial Number: ' + serial);
  connection.open();

  const ready = await deviceReady(connection);
  if (ready) {
    await sendData(connection, 70, '00');

    const receivedHash = await receiveCommand(connection, 13);
    console.log('receivedHash: ', receivedHash);
    await sendData(connection, 16, '12345678');

    const challangeHash = await receiveCommand(connection, 17);
    console.log('challangeHash :', challangeHash);
  } else {
    console.log('device not ready');
  }
  connection.close();
};

export default cardAuth;
