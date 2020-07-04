//Calculates CRC which uses bitwise operators.
const updateCRC16 = (crcParam: any, byte: any) => {
  //tslint:disable-next-line
  let input = byte | 0x100;
  let crc = crcParam;
  do {
      //tslint:disable-next-line
    crc <<= 1;
      //tslint:disable-next-line
    input <<= 1;
      //tslint:disable-next-line
    if (input & 0x100) crc += 1;
      //tslint:disable-next-line
    if (crc & 0x10000) crc ^= 0x1021;
      //tslint:disable-next-line
  } while (!(input & 0x10000));
    //tslint:disable-next-line
  return crc & 0xffff;
};

const crc16 = (dataBuff: Buffer) => {
  let crc = 0;

  for (const i of dataBuff) {
    crc = updateCRC16(crc, i);
  }
  //code that works for sure.
  // for (let i = 0; i < dataBuff.length; i += 1) {
  //   crc = updateCRC16(crc, dataBuff[i]);
  // }

  crc = updateCRC16(crc, 0);
  crc = updateCRC16(crc, 0);
    //tslint:disable-next-line
  return crc & 0xffff;
};

export { updateCRC16, crc16 };
