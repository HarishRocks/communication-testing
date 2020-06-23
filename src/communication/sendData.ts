import { constants, commands, radix } from '../config';
import { xmodemDecode, xmodemEncode } from '../xmodem';
import { intToUintByte, byteStuffing } from '../bytes';
import { crc16 } from './crc';

const { START_OF_FRAME } = constants;

const writePacket = (connection: any, packet: any) => {
  return new Promise((resolve, reject) => {
    /**
     * Ensure is listener is activated first before writing
     */
    const eListener = (packet: any) => {
      const data = xmodemDecode(packet);
      data.forEach((d) => {
        const { commandType } = d;
        if (Number(commandType) === commands.ACK_PACKET) {
          console.log("ack recieved");
          /**
           * We got a packet so just accept
           */
          resolve(true);
          connection.removeListener('data', eListener);
        }
      });
    }

    connection.on('data', eListener);
    /**
     * Write packet
     */
    connection.write(Buffer.from(`aa${packet}`, 'hex'), (err: any) => {
      if (err) {
        reject('device diconnected');
        return;
      }
    });

    /**
     * as writing is done, fail so we can retry if no acknowledgement within 2 second
     */
    setTimeout(() => reject(), 2000);
  });
};

const sendData = async (connection: any, command: number, data: string) => {
  const packetsList = xmodemEncode(data, command);
  console.log("Packets List " + packetsList.length);
  /**
   * Create a list of each packet and self contained retries and listener
   */
  const dataList = packetsList.map((d) => {
    return async (resolve: any, reject: any) => {
      let tries = 1;
      while (tries <= 5) {
        try {
          console.log("for command " + String(command) + " try no. " + (tries))
          await writePacket(connection, d);
          resolve(true);
          return;
        } catch (e) { console.log("Caught error") }
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
  for (let i = 0; i < dataList.length; i++) {
    try {
      await new Promise((res, rej) => {
        dataList[i](res, rej);
      });
    } catch (e) {
      throw new Error('error writing');
    }
  }
};

const ackData = (commandType: number, packetNumber: string) => {
  const currentPacketNumber = intToUintByte(
    packetNumber,
    radix.currentPacketNumber
  );

  const totalPacket = intToUintByte(0, radix.totalPacket);
  const dataChunk = '00000000';
  const commData = currentPacketNumber + totalPacket + dataChunk;
  const crc = crc16(Buffer.from(commData, 'hex')).toString(16);
  const stuffedData = byteStuffing(Buffer.from(commData + crc, 'hex')).toString(
    'hex'
  );
  const commHeader =
    START_OF_FRAME +
    intToUintByte(commandType, radix.commandType) +
    intToUintByte(stuffedData.length / 2, radix.dataSize);

  const packet = commHeader + stuffedData;
  return packet;
};

export { ackData, sendData };
