import { createPort, openConnection, closeConnection } from '../core/port';
import { sendData } from '../core/sendData';
import { receiveCommand } from '../core/recieveData';
import crypto from 'crypto';

function randomNumber(min: number, max: number) {
  return Math.floor(Math.random() * (max - min) + min);
}

const commTest = async () => {
  const { connection, serial } = await createPort();
  console.log('Serial Number: ' + serial);
  await openConnection(connection);

  let totalSuccess = 0;
  let totalFailed = 0;

  for (let i = 0; i < 100; i++) {
    try {
      const commandType = randomNumber(1, 50);
      const data = crypto.randomBytes(randomNumber(1, 10)).toString('hex');
      console.log({ commandType, data });
      await sendData(connection, commandType, data);
      const recData = await receiveCommand(connection, commandType);
      if (recData !== data) {
        throw new Error('Invalid data received');
      }
      totalSuccess++;
    } catch (error) {
      console.error(error);
      totalFailed++;
    }
  }

  console.log({ totalSuccess, totalFailed });

  await closeConnection(connection);
};

export default commTest;
