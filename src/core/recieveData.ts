import { SerialPortType } from '../config/serialport';
import { xmodemDecode } from '../xmodem/index';
import { ackData } from './sendData';
import { commands } from '../config';
const { ACK_PACKET } = commands;

// returns the received data value in hex for the supplied command
export const receiveCommand = (
  connection: SerialPortType,
  command: any
): Promise<string> => {
  const resData: any = [];
  return new Promise((resolve, reject) => {
    const eListener = (packet: any) => {
      // console.log(packet)
      const data = xmodemDecode(packet);
      data.forEach((d) => {
        const { commandType, currentPacketNumber, totalPacket, dataChunk } = d;
        if (commandType === command) {
          resData[currentPacketNumber - 1] = dataChunk;
          const ackPacket = ackData(
            ACK_PACKET,
            `0x${currentPacketNumber.toString(16)}`
          );

          connection.write(Buffer.from(`aa${ackPacket}`, 'hex'));
          if (currentPacketNumber === totalPacket) {
            resolve(resData.join(''));
            connection.removeListener('data', eListener);
          }
        }
      });
    };
    connection.on('data', eListener);
  });
};

// returns the commandType and the data recieved from device
// open channel: will catch every command and data
export const recieveData = (connection: SerialPortType) => {
  const resData: any = [];
  return new Promise((resolve, reject) => {
    const eListener = (packet: any) => {
      const data = xmodemDecode(packet);
      data.forEach((d) => {
        const { commandType, currentPacketNumber, totalPacket, dataChunk } = d;
        resData[currentPacketNumber - 1] = dataChunk;
        const ackPacket = ackData(
          ACK_PACKET,
          `0x${currentPacketNumber.toString(16)}`
        );
        // Don't add the initial `aa` when mocking, this is for the simulator to work properly
        if (process.env.MOCK === 'true') {
          connection.write(Buffer.from(`${ackPacket}`, 'hex'));
        } else {
          connection.write(Buffer.from(`aa${ackPacket}`, 'hex'));
        }
        if (currentPacketNumber === totalPacket) {
          resolve({ commandType, data: resData.join('') });

          /**
           * We don't have to remove listener for this this one as this
           * one is for internal usages, global listener
           * in case need to test listener uncomment line below
           */
          // connection.removeListener('data', eListener)
        }
      });
    };
    connection.on('data', eListener);
  });
};
