import fs from 'fs';
import { sendData } from '../core/stmSendData';
import { createPort } from '../core/port';

const filename = 'BlinkLed_Signed.bin';

const stmUpdate = () => {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, async (error, data) => {
      if (error) {
        console.log(error);
        reject(error);
        return;
      }

      const { connection } = await createPort();
      connection.open(async (err) => {
        if (err) {
          console.log(err);
          reject(error);
          return;
        }

        await sendData(connection, data.toString('hex'));
        resolve();
      });
    });
  });
};

export default stmUpdate;
