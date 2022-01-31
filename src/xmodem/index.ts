import { constants, radix } from '../config';
import { byteStuffing, byteUnstuffing, intToUintByte } from '../bytes';
import { crc16 } from '../core';
export * from './stm';

const { CHUNK_SIZE, START_OF_FRAME } = constants;

/**
 * Encodes the data and command number, and returns a list of packets.
 *
 *
 * @param data - Data in hex format
 * @param commandType - The command number to be sent
 * @return list of packets (or list of strings)
 */
const xmodemEncode = (data: string, commandType: number) => {
  const rounds = Math.ceil(data.length / CHUNK_SIZE);
  const packetList: string[] = [];
  for (let i = 1; i <= rounds; i += 1) {
    const currentPacketNumber = intToUintByte(i, radix.currentPacketNumber);
    const totalPacket = intToUintByte(rounds, radix.totalPacket);
    const dataChunk = data.slice(
      (i - 1) * CHUNK_SIZE,
      (i - 1) * CHUNK_SIZE + CHUNK_SIZE
    );
    const commData = currentPacketNumber + totalPacket + dataChunk;
    const crc = intToUintByte(crc16(Buffer.from(commData, 'hex')), 16);
    const stuffedData = byteStuffing(
      Buffer.from(commData + crc, 'hex')
    ).toString('hex');
    const commHeader =
      START_OF_FRAME +
      intToUintByte(commandType, radix.commandType) +
      intToUintByte(stuffedData.length / 2, radix.dataSize);
    const packet = commHeader + stuffedData;
    packetList.push(packet);
  }
  return packetList;
};

/**
 * Decodes the data from a Buffer object into a packetList with the format
 *   {
 *    startOfFrame,
 *     commandType,
 *     currentPacketNumber,
 *     totalPacket,
 *     dataSize,
 *     dataChunk,
 *     crc,
 *     errorList
 *   }
 *
 *
 * @param param - Data in buffer object
 * @return list of decoded packets
 */
const xmodemDecode = (param: Buffer) => {
  let data = param.toString('hex').toUpperCase();
  const packetList: any[] = [];
  let offset = data.indexOf(START_OF_FRAME);

  while (data.length > 0) {
    offset = data.indexOf(START_OF_FRAME);
    const startOfFrame = data.slice(offset, offset + START_OF_FRAME.length);
    offset += START_OF_FRAME.length;
    const commandType = parseInt(
      `0x${data.slice(offset, offset + radix.commandType / 4)}`,
      16
    );
    offset += radix.commandType / 4;
    const dataSize = parseInt(
      data.slice(offset, offset + radix.dataSize / 4),
      16
    );
    offset += radix.dataSize / 4;
    const stuffedData = data.slice(offset, offset + dataSize * 2);
    data = data.slice(offset + dataSize * 2);
    const unStuffedData = byteUnstuffing(
      Buffer.from(stuffedData, 'hex')
    ).toString('hex');
    offset = 0;
    const currentPacketNumber = unStuffedData.slice(
      offset,
      offset + radix.currentPacketNumber / 4
    );
    offset += radix.currentPacketNumber / 4;
    const totalPacket = unStuffedData.slice(
      offset,
      offset + radix.totalPacket / 4
    );
    offset += radix.totalPacket / 4;
    const dataChunk = unStuffedData.slice(
      offset,
      offset + unStuffedData.length - 6 * 2
    );
    offset += unStuffedData.length - 6 * 2;
    const crc = unStuffedData.slice(offset, offset + radix.crc / 4);
    const crcInput = unStuffedData.slice(
      0,
      unStuffedData.length - radix.crc / 4
    );
    const actualCRC = crc16(Buffer.from(crcInput, 'hex')).toString(16);

    // data validation
    let errorList = '';
    if (startOfFrame.toUpperCase() !== START_OF_FRAME)
      errorList += ' Invalid Start of frame ';
    if (currentPacketNumber > totalPacket)
      errorList += ' currentPacketNumber is greater than totalPacketNumber ';
    if (dataSize > CHUNK_SIZE)
      // chunk size is already 2 times, and data size in worst case(all bytes stuffed) should be less than 2 time the actual chunk size
      errorList += ' invalid data size ';
    if (actualCRC !== crc) errorList += ' invalid crc ';
    packetList.push({
      startOfFrame,
      commandType,
      currentPacketNumber: Number(`0x${currentPacketNumber}`),
      totalPacket: Number(`0x${totalPacket}`),
      dataSize,
      dataChunk,
      crc,
      errorList,
    });
  }
  return packetList;
};

export { xmodemDecode, xmodemEncode };
