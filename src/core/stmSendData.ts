import { stmUpdateSendData as commSendData } from '@cypherock/communication';
import SerialPort from 'serialport';
import { xmodemEncode } from '../xmodem/stm';
// @ts-ignore
import * as logs from 'simple-node-logger';

const log = logs.createSimpleFileLogger('project.log');

const ACK_PACKET = '06';
const ERROR_CODES = [
  {
    code: '07',
    message: 'Limit exceeded',
  },
  {
    code: '08',
    message: 'Wrong firmware version',
  },
  {
    code: '09',
    message: 'Wrong hardware version',
  },
  {
    code: '0a',
    message: 'Wrong magic number',
  },
  {
    code: '0b',
    message: 'Signature not verified',
  },
];

/*
 * Resolves to an error msg returned from device or undefined if successful,
 * throws error if unable to send packet.
 */
const writePacket = (
  connection: any,
  packet: any,
  options?: { timeout?: number }
): Promise<string | undefined> => {
  return new Promise((resolve, reject) => {
    /**
     * Ensure is listener is activated first before writing
     */
    const eListener = (ePacket: any) => {
      const ePacketData = ePacket.toString('hex');
      console.log(ePacketData);
      // console.log(data);

      // When a error code is received, return the error
      for (const errorCode of ERROR_CODES) {
        if (ePacketData.includes(errorCode.code)) {
          resolve(errorCode.message);
          connection.removeListener('data', eListener);
          return;
        }
      }

      if (ePacketData.includes(ACK_PACKET)) {
        log.info('ack recieved');
        /**
         * We got a packet so just accept
         */
        resolve(undefined);
        connection.removeListener('data', eListener);
      }
    };

    connection.on('data', eListener);
    /**
     * Write packet
     */
    connection.write(Buffer.from(packet, 'hex'), (err: any) => {
      if (err) {
        reject('device diconnected');
        return;
      }
    });

    /**
     * as writing is done, fail so we can retry if no acknowledgement within 2 second
     */
    if (options && options.timeout !== undefined) {
      setTimeout(() => reject(), options.timeout);
    } else {
      setTimeout(() => reject(), 2000);
    }
  });
};

const sendData = async (connection: any, data: string) => {
  if (connection instanceof SerialPort) {
    return commSendData(connection, data);
  }

  const packetsList = xmodemEncode(data);
  log.info('Number of packets sending ' + packetsList.length);
  /**
   * Create a list of each packet and self contained retries and listener
   */
  let i = 1;
  const dataList = packetsList.map((d: any, index: number) => {
    return async (resolve: any, reject: any) => {
      let tries = 1;
      while (tries <= 5) {
        try {
          const errorMsg = await writePacket(
            connection,
            d,
            // Wait for 10 sec for the 1st packet ACK, there may be heavy processing task
            // in device after 1st packet.
            index === 0 ? { timeout: 10000 } : undefined
          );
          if (!errorMsg) {
            i += 1;
            console.log('Send Packet: ' + d);
            resolve(true);
            return;
          } else {
            log.error(errorMsg);
            console.log(errorMsg);
            reject(false);
            return;
          }
        } catch (e) {
          log.error('Caught error');
          console.log('Caught Error');
        }
        tries++;
      }
      reject(false);
    };
  });

  /**
   * Try each packet if any one of them fail
   * after 5 retries or hardware disconnet
   * fail immideatly
   */
  //changed for linting purposes
  // for (let i = 0; i < dataList.length; i++) {
  //   try {
  //     await new Promise((res, rej) => {
  //       dataList[i](res, rej);
  //     });
  //   } catch (e) {
  //     throw new Error('error writing');
  //   }
  // }

  for (const i of dataList) {
    try {
      await new Promise((res, rej) => {
        i(res, rej);
      });
    } catch (e) {
      throw new Error('error writing');
    }
  }
};

export { sendData };
