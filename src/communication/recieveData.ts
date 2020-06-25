import { xmodemDecode } from '../xmodem';
import { ackData } from '../communication/sendData';
import { commands } from '../config';
const { ACK_PACKET } = commands;

// returns the recieved data value in hex for the supplied command
export const recieveCommand = (connection: any, command: any) => {
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
export const recieveData = (connection: any) => {
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
        connection.write(Buffer.from(`aa${ackPacket}`, 'hex'));
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
