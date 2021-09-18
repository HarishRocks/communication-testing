import { createPort } from '../core/port';
import deviceReady from '../core/deviceReady';
import { sendData } from '../core/sendData';
import { receiveCommand } from '../core/recieveData';

export default async (actions: any[]) => {
  const { connection, serial } = await createPort();
  console.log('Serial Number: ' + serial);
  await new Promise((resolve, reject) =>
    connection.open(err => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    })
  );

  const ready = await deviceReady(connection);
  if (ready) {
    for (const action of actions) {
      switch (action.type) {
        case 'SEND':
          await sendData(connection, action.command, action.data);
          console.log(`Sent: ${action.command},${action.data}`);
          break;
        case 'RECEIVE':
          const received = await receiveCommand(connection, action.command);
          console.log(`Received: ${action.command},${received}`);
          break;
        default:
          throw new Error('invalid command type');
      }
    }
  } else {
    console.log('device not ready');
  }
  connection.close();
};
