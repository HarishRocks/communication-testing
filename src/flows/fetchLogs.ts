import fs from 'fs';
import path from 'path';
import process from 'process';
import { createPort, openConnection, closeConnection } from '../core/port';
import { sendData } from '../core/sendData';
import { recieveData, receiveCommand } from '../core/recieveData';
import { addWalletToDB, allAvailableWallets } from './wallet';
import deviceReady from '../core/deviceReady';
import { hexToAscii } from '../bytes';
import isExecutable from '../utils/isExecutable';

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

//const waitForMessage = (connection: any) => {
//return new Promise(async (resolve, reject) => {
//setTimeout(() => resolve(false), 5000);
//const data = await receiveCommand(connection, 38);
//resolve(true);
//if (!hexToAscii(data).includes('ÿ')) {
//console.log(hexToAscii(data)):
//log.info(hexToAscii(data));
//}
//});
//};

export const fetchLogs = async () => {
  const { connection, serial } = await createPort();
  await openConnection(connection);

  console.log('Opened connection.');
  let stream: fs.WriteStream;
  if (isExecutable()) {
    stream = fs.createWriteStream(path.join(process.cwd(), 'deviceLogs.log'), {
      flags: 'a',
    });
  } else {
    stream = fs.createWriteStream(
      path.join(__dirname, '../', '../', 'deviceLogs.log'),
      { flags: 'a' }
    );
  }

  const ready = await deviceReady(connection);

  if (ready) {
    await sendData(connection, 37, '00');

    console.log('Waiting for user confirmation.');
    const acceptedRequest: any = await receiveCommand(connection, 37);
    if (acceptedRequest === '00') {
      console.error('Rejected by user');
      return;
    }

    stream.write('\n\n****************************************\n\n');

    await sendData(connection, 38, '00');

    let data: any = '';
    let rawData: any;
    console.log('Fetching logs...');
    let i = 1;
    //end of packet in hex with carrige return and line feed.
    while (rawData !== '656e646f667061636b65740d0a') {
      console.log('Waiting to receive line: ' + i);
      i += 1;
      rawData = await receiveCommand(connection, 38, 2000);
      data = hexToAscii(rawData);
      stream.write(data);
      console.log(data);
    }
  } else {
    console.error('Device not ready');
  }
  // const ready = await deviceReady(connection);

  // only proceed if device is ready, else quit.

  await closeConnection(connection);
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
