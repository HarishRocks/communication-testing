//Find out coin from recieve address - done
//ToDo, create a universal coinType object for refrence in whole system - done (kind of)
//ToDo, think of another file for display_all_wallets function.

import { createPort } from '../communication/port';
import { ackData, sendData } from '../communication/sendData';
import { coins as COINS } from '../config';
import { recieveData, recieveCommand } from '../communication/recieveData';
import deviceReady from '../communication/deviceReady';

const cardAuth = async () => {
  const { connection, serial } = await createPort();
  console.log('Serial Number: ' + serial);
  connection.open();

  const ready = await deviceReady(connection);
  if (ready) {
    await sendData(connection, 70, '00');

    const receivedHash = await recieveCommand(connection, 13);
    console.log('receivedHash: ', receivedHash);
    await sendData(connection, 16, '12345678');

    const challangeHash = await recieveCommand(connection, 17);
    console.log('challangeHash :', challangeHash);
  } else {
    console.log('device not ready');
  }
};

export default cardAuth;
