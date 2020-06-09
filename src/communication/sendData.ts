import { constants, commands, radix } from '../config';
import { xmodemDecode } from '../xmodem';
import { intToUintByte, byteStuffing } from '../bytes';
import { crc16 } from './crc';

const { START_OF_FRAME } = constants;

const sendPacket = (connection: any) => (
  packetList: Array<string>,
  i: number,
  ackList: Map<number, boolean>,
  count = 0
): void => {
  const temp = Buffer.from(`aa${packetList[i]}`, 'hex');
  connection.write(temp, (err: any) => {
    if (err)
      console.log(`Error: Error in writing data to serial, ${err.message}`);
    else console.log(`Info: Packet written to device: ${packetList[i]}`);
  });
  setTimeout(
    (packetNumber) => {
      if (!ackList.get(packetNumber) && count < 0) {
        sendPacket(connection)(packetList, packetNumber, ackList, count + 1);
      }
    },
    constants.ACK_TIME,
    i
  );
};

const sendData = (connection: any) => (packetList: Array<string>): void => {
  let i = 0;
  // const port = createdPorts.get(currentPort);
  const ackList = new Map();
  sendPacket(connection)(packetList, i, ackList);

  connection.on('data', (serialData: Buffer) => {
    i += 1;
    const resList = xmodemDecode(serialData);
    resList.forEach((res) => {
      const { currentPacketNumber, commandType: decodedCommandType } = res;
      if (Number(decodedCommandType) === commands.ACK_PACKET) {
        ackList.set(i - 1, true);
        console.log(
          `Info: Ack for packet ${packetList[Number(currentPacketNumber) - 1]}`
        );
        if (i < packetList.length)
          sendPacket(connection)(packetList, i, ackList);
      }
    });
  });
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
