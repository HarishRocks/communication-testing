import { sendData } from './sendData';
import { recieveCommand } from './recieveData';

const deviceReady = (connection: any) => {
  return new Promise(async (resolve, reject) => {
    console.log(`Desktop : Sending Ready Command. \n`);
    await sendData(connection, 41, '00');

    let deviceResponse = await recieveCommand(connection, 42);
    console.log('Ready Response: ' + String(deviceResponse));

    resolve(String(deviceResponse).slice(0, 2) == '02');
  });
};

export default deviceReady;
