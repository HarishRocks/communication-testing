import { sendData } from './sendData';
import { recieveCommand } from './recieveData';

const deviceReady = (connection: any) => {
  return new Promise(async (resolve, reject) => {
    recieveCommand(connection, 42).then((deviceResponse: any) => {
      console.log('Ready Response: ' + String(deviceResponse));
      resolve(String(deviceResponse).slice(0, 2) === '02');
    });
    console.log(`Desktop : Sending Ready Command. \n`);
    await sendData(connection, 41, '00');
  });
};

export default deviceReady;
