import dotenv from 'dotenv-flow';
dotenv.config();

import { hexToAscii } from './bytes';
import { queryInput } from './cli/helper/cliInput';
import { createPort } from './core/port';
import { recieveData } from './core/recieveData';
import { sendData } from './core/sendData';
console.log(process.env.ONLYASCII, process.env.ASCII);

const customLiveReceive = async (connection: any) => {
  while (1) {
    const { commandType, data }: any = await recieveData(connection);
    connection.removeAllListeners();
    if (commandType === 1) console.log('Ack received');
    else {
      if (process.env.ONLYASCII === 'true') {
        console.log(
          `Received Command ${commandType} (Ascii Data) : ${hexToAscii(data)}`
        );
      } else {
        console.log(`Received Command ${commandType} : ${data}`);
        if (process.env.ASCII === 'true') {
          console.log(
            `Received Command ${commandType} (Ascii Data) : ${hexToAscii(data)}`
          );
        }
      }
    }
  }
};

const customLiveSend = async (connection: any) => {
  while (1) {
    const data = await queryInput(' ');
    const [commandType, message] = data.split(',');
    await sendData(connection, parseInt(commandType), message);
  }
};

const customLive = async () => {
  const { connection } = await createPort();
  connection.open();
  customLiveReceive(connection);
  customLiveSend(connection);
};

customLive();
