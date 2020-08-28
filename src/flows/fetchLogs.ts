import { createPort } from '../core/port';
import { sendData } from '../core/sendData';
import { recieveData, receiveCommand } from '../core/recieveData';
import { addWalletToDB, allAvailableWallets } from './wallet';
import deviceReady from '../core/deviceReady';
import { hexToAscii } from '../bytes';

// @ts-ignore
import * as logs from 'simple-node-logger';

const log = logs.createSimpleFileLogger('deviceLogs.log');

// ADD_LOG_DATA_REQUEST: 37,
// ADD_LOG_DATA_SEND: 38,

// const waitForMessage = (connection : any) => {
//   return new Promise((resolve, reject) => {
//     setTimeout( ()=>resolve(false), 1000);
//     const data = await receiveCommand(connection, 38);
//       if(!hexToAscii(data).includes('ÿ'))
//         log.info(hexToAscii(data));
//     }
//   })
// }

const waitForMessage = (connection: any) => {
  return new Promise(async (resolve, reject) => {
    setTimeout(() => resolve(false), 5000);
    const data = await receiveCommand(connection, 38);
    resolve(true);
    if (!hexToAscii(data).includes('ÿ')) {
      console.log(hexToAscii(data));
      log.info(hexToAscii(data));
    }
  });
};

export const fetchLogs = async () => {
  const { connection, serial } = await createPort();
  connection.open();
  console.log('Opened connection.');

  // const ready = await deviceReady(connection);

  // only proceed if device is ready, else quit.
  if (1) {
    console.log(`\n\nDesktop : Sending Fetch Logs Command.\n\n`);
    await sendData(connection, 37, '00000000');

    while (1) {
      if (await waitForMessage(connection)) {
        console.log('true');
      } else break;
    }

    console.log('out of for loop.');
  }

  connection.close();
  connection.on('error', (d) => {
    console.log(d);
  });
};

// ONLY FOR TESTING PURPOSES RIGHT NOW
// Not Required Anymore
// export const addWalletDeviceInitiated = async () => {

//   const { connection, serial } = await createPort();
//   connection.open();

//   // this will work only one time and will self exit to prevent memory leak
//   // initiate them whenever needed to get data otherwise just ignore it

//   console.log('Wallet Details From Device: ');
//   let d = await receiveCommand(connection, 44);
//   console.log(d);

//   console.log(`\n\nDesktop : Sending Success Command.`);
//   await sendData(connection, 42, "01");

//   connection.close();
//   connection.on('error', (d) => {
//     console.log(d);
//   });
// }
