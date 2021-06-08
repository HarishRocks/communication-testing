import { constants, commands, radix } from '../config';
import { xmodemDecode, xmodemEncode } from '../xmodem/stm';
import { intToUintByte, byteStuffing } from '../bytes';
import { crc16 } from './crc';
// @ts-ignore
import * as logs from 'simple-node-logger';

const log = logs.createSimpleFileLogger('project.log');

const { START_OF_FRAME } = constants;
const ACK_PACKET = '06';

const writePacket = (
  connection: any,
  packet: any,
  options?: { timeout?: number }
) => {
  return new Promise((resolve, reject) => {
    /**
     * Ensure is listener is activated first before writing
     */
    const eListener = (ePacket: any) => {
      const ePacketData = ePacket.toString('hex');
      console.log(ePacketData);
      // console.log(data);
      if (ePacketData.includes(ACK_PACKET)) {
        log.info('ack recieved');
        /**
         * We got a packet so just accept
         */
        resolve(true);
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
          await writePacket(
            connection,
            d,
            // Wait for 10 sec for the 1st packet ACK, there may be heavy processing task
            // in device after 1st packet.
            index === 0 ? { timeout: 10000 } : undefined
          );
          i += 1;
          console.log('Send Packet: ' + d);
          resolve(true);
          return;
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
