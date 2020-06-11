const byteUnstuffing = (inputBuff: Buffer): Buffer => {
  if (inputBuff.length <= 0) throw new Error('Byte unstuffing failed: 0 size');
  const size = inputBuff.length;
  const outputData: any = [];
  for (let i = 0; i < size; i += 1) {
    if (inputBuff[i] === 0xa3 && i < size - 1) {
      if (inputBuff[i + 1] === 0x3a) {
        outputData.push(0xaa);
        i += 1;
      } else if (inputBuff[i + 1] === 0x33) {
        outputData.push(0xa3);
        i += 1;
      } else {
        outputData.push(inputBuff[i]);
      }
    } else {
      outputData.push(inputBuff[i]);
    }
  }
  return Buffer.from(outputData, 'hex');
};

const byteStuffing = (inputBuff: Buffer) => {
  if (inputBuff.length <= 0) throw new Error('Byte stuffing failed: 0 size');
  const outputData: any = [];
  inputBuff.forEach((byte) => {
    if (byte === 0xaa) {
      outputData.push(0xa3);
      outputData.push(0x3a);
    } else if (byte === 0xa3) {
      outputData.push(0xa3);
      outputData.push(0x33);
    } else {
      outputData.push(byte);
    }
  });
  return Buffer.from(outputData, 'hex');
};

const intToUintByte = (ele: any, _radix: number) => {
  const val = Number(ele).toString(16);
  const noOfZeroes = _radix / 4 - val.length;
  let res = '';
  for (let i = 0; i < noOfZeroes; i += 1) {
    res += '0';
  }
  return res + val;
};

const hexToAscii = (str1 : any) => {
  const hex = str1.toString();
  let str = '';
  for (let n = 0; n < hex.length; n += 2) {
    str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
  }
  return str;
};

export { byteStuffing, byteUnstuffing, intToUintByte, hexToAscii };
