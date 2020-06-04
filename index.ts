const SerialPort = require('serialport');
const p = require('prompt-sync')();


//CRC
function updateCRC16(crcParam, byte) {
	let input = byte | 0x100;
	let crc = crcParam;
	do {
		crc <<= 1;
		input <<= 1;
		if (input & 0x100) crc += 1;
		if (crc & 0x10000) crc ^= 0x1021;
	} while (!(input & 0x10000));
	return crc & 0xffff;
}
const crc16 = (dataBuff: Buffer) => {
	let crc = 0;

	for (let i = 0; i < dataBuff.length; i += 1) {
		crc = updateCRC16(crc, dataBuff[i]);
	}

	crc = updateCRC16(crc, 0);
	crc = updateCRC16(crc, 0);
	return crc & 0xffff;
};
//End ECE


//Byte Stuffing

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
	// return outputData;
	return Buffer.from(outputData, 'hex');
};

const byteStuffing = (inputBuff: Buffer) => {
	if (inputBuff.length <= 0) throw new Error('Byte stuffing failed: 0 size');
	const outputData: any = [];
	inputBuff.forEach(byte => {
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
	// return outputData;
	return Buffer.from(outputData, 'hex');
};

//End Byte Stuffing


let radix = {
	currentPacketNumber: 16,
	totalPacket: 16,
	dataSize: 8,
	commandType: 8,
	walletIndex: 8,
	coinType: 8,
	futureUse: 8,
	inputOutputCount: 8,
	addressIndex: 32,
	accountIndex: 8,
	crc: 16,
	outputLength: 8,
	addCoins: {
		wallet: 128,
		noOfCoins: 8,
		coinType: 32,
	},
	receiveAddress: {
		coinType: 32,
		accountIndex: 32,
	},
}

let constants = {
	START_OF_FRAME: 'AA',
	ACK_BYTE: '06',
	CHUNK_SIZE: 32 * 2,
	ACK_TIME: 150,
}

let commandType = {
	ACK_PACKET: 1,
	TRANSACTION_PACKET: 2, // only received
	WALLET_INDEX_PACKET: 3, // only sent
	COIN_VERIFIED_PACKET: 4, // only sent
	ADDRESSES_VERIFIED_PACKET: 5, // only sent
	SIGNED_TRANSACTION_PACKET: 6, // only sent
	ERROR_PACKET: 7,
	USB_CONNECTION_STATE_PACKET: 8, // with user name/
	GO_TO_DFU_MODE: 9,
	ADD_COINS: 10,
	RECEIVE_ADDRESS: 11,
	//  start Auth command
	START_AUTH_PROCESS: 12,
	SEND_SIGNATURE_TO_APP: 13,
	REQUEST_FIRMWARE_VERSION: 14,
	FIRMWARE_VERSION: 15,
	APP_SEND_RAND_NUM: 16,
	SIGNED_CHALLENGE: 17,
	// start UPGRADE command
	UPGRADE_FIRMWARE: 18, // where to use it?
	DEVICE_CONFIRM_FOR_DFU_MODE: 19,
	// start provision command
	REQUEST_PROVISION_STATUS: 20,
	PROVISION_STATUS: 21,
	PROVISION_WITH_SERIAL_NUM: 22,
	REQUEST_READ_SERIAL_NUM: 23,
	READ_SERIAL_NUM: 24,
	DEVICE_PUBLIC_KEY: 25,
	CONFIGURATION_LOCK: 26,

	// add coins
	SEND_WALLET_TO_DESKTOP: 28,
	UPGRADE_FIRMWARE_RESPONSE: 29,
	MAKE_TRANSACTION_SELECTED: 31,
	PIN_ENTERED: 32,
	CARD_TAP: 33,
	ADD_COIN_SELECTED: 34,
	ADD_COIN_COMPLETED: 35,
	RECEIVE_TRANSACTION_SELECTED: 36,
	COIN_VERIFIED: 87,

	// logging
	ADD_LOG_DATA_REQUEST: 37,
	ADD_LOG_DATA_SEND: 38,
}

const { START_OF_FRAME, CHUNK_SIZE } = constants;

const intToUintByte = (ele, _radix) => {
	const val = Number(ele).toString(16);
	const noOfZeroes = _radix / 4 - val.length;
	let res = '';
	for (let i = 0; i < noOfZeroes; i += 1) {
		res += '0';
	}
	return res + val;
};


//XModem 
const xmodemEncode = (data: string, commandType: number) => {
	const rounds = Math.ceil(data.length / CHUNK_SIZE);
	const packetList: Array<string> = [];
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
		// ' ' +
		intToUintByte(commandType, radix.commandType) +
		// ' ' +
		intToUintByte(stuffedData.length / 2, radix.dataSize);
		// ' '
		const packet = commHeader + stuffedData;
		packetList.push(packet);
	}
	return packetList;
};


const xmodemDecode = (param: Buffer) => {
	let data = param.toString('hex').toUpperCase();
	const packetList: Array<any> = [];
	let offset = data.indexOf(START_OF_FRAME);

	while (data.length > 0) {
		offset = data.indexOf(START_OF_FRAME);
		const startOfFrame = data.slice(offset, offset + 2);
		offset += 2;
		// const commandType = data.slice(offset, offset + radix.commandType / 4);
		const commandType = parseInt(
			`0x${data.slice(offset, offset + radix.commandType / 4)}`,
			16
			);
		offset += radix.commandType / 4;
		// let dataSize = data.slice(offset, offset + radix.dataSize / 4);
		const dataSize = parseInt(
			data.slice(offset, offset + radix.dataSize / 4),
			16
			);
		offset += radix.dataSize / 4;
		// console.log('data size', dataSize)
		const stuffedData = data.slice(offset, offset + dataSize * 2);
		// console.log('stuffed data', stuffedData)
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
		// console.log('input for crc', crcInput)
		const actualCRC = crc16(Buffer.from(crcInput, 'hex')).toString(16);

		// data validation
		let errorList = '';
		if (startOfFrame.toUpperCase() !== 'AA') errorList.concat();
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
			errorList
		});
	}
	return packetList;
};

const hexToAscii = (str1: number) => {
	const hex = str1.toString();
	let str = '';
	for (let n = 0; n < hex.length; n += 2) {
		str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
	}
	return str;
};


//End XModem


let currentPort = '';
let hardwarePort;
let serialNumber = '';

const createdPorts = new Map();

const myCreatePort = port => {
  if (createdPorts.has(port)) {
    const oldPort = createdPorts.get(port);
    if (oldPort.isOpen) oldPort.close();
  }

  hardwarePort = new SerialPort(port, {
    baudRate: 115200,
    autoOpen: false
  });
  hardwarePort.open();
  currentPort = port;
  createdPorts.set(port, hardwarePort);
  // TODO : call a function to request serial number and set it to global context
  hardwarePort.on('open', () => {
    console.log('Info: '+'Port opened');
  });
  hardwarePort.on('close', () => {
    console.log('Info: '+'Port closed');
    // hardwarePort = null;
  });

  hardwarePort.on('error', (err: Error) => {
    console.log('Info: '+'Error with port');
    console.log('Error: '+err);
  });

  return { hardwarePort, serialNumber };
};

function sendPacket(
  packetList: Array<string>,
  i: number,
  ackList: Map<number, boolean>,
  count = 0
): void {
  const temp = Buffer.from(`aa${packetList[i]}`, 'hex');
  hardwarePort.write(temp, err => {
    if (err) console.log('Error: '+`Error in writing data to serial, ${err.message}`);
    else console.log('Info: '+`Packet written to device: ${packetList[i]}`);
  });
  setTimeout(
    packetNumber => {
      if (!ackList.get(packetNumber) && count < 5) {
        // resend packet
        sendPacket(packetList, packetNumber, ackList, count + 1);
      }
    },
    constants.ACK_TIME,
    i
  );
}

const sendData = (packetList: Array<string>): void => {
  let i = 0;
  // const port = createdPorts.get(currentPort);
  const ackList = new Map();
  sendPacket(packetList, i, ackList);

  hardwarePort.on('data', (serialData: Buffer) => {
    i += 1;
    const resList = xmodemDecode(serialData);
    resList.forEach(res => {
      const { currentPacketNumber, commandType: decodedCommandType } = res;
      if (Number(decodedCommandType) === commandType.ACK_PACKET) {
        ackList.set(i - 1, true);
        console.log('Info: '+
          `Ack for packet ${packetList[Number(currentPacketNumber) - 1]}`
        );
        if (i < packetList.length) sendPacket(packetList, i, ackList);
      }
    });
  });
};


const createPort = () => {
  return SerialPort.list().then(list => {
    let port;
    list.forEach(portParam => {
      const { vendorId } = portParam;
      if (vendorId && Number(vendorId) === 1915) {
        port = portParam;
      }
    });
    if (!port) {
      //   dispatch({
      //     type: SET_ERRORS,
      //     payload: DEVICE_NOT_CONNECTED
      //   });
      throw new Error('Device not connected');
    } else {
      const { path, serialNumber: deviceSerialNumber } = port;
      serialNumber = deviceSerialNumber;
      //   dispatch({
      //     type: 'SET_DEVICE_SERIAL',
      //     payload: serialNumber
      //   });
      return myCreatePort(path);
    }
  });
};

const getInstance = () => createdPorts.get(currentPort);


const closePort = (): void => {
  if (hardwarePort !== undefined && hardwarePort.isOpen) {
    hardwarePort.close();
  }
};

const openPort = (): Promise<any> => {
  return new Promise(resolve => {
    resolve(createPort());
  });
};

const str = p('Enter the string');
const cmd = p('Enter the Command Type ')

openPort().then(portData => {
	hardwarePort = portData.hardwarePort;
	const packetList = xmodemEncode(str, Number(cmd));

	console.log("Info: ");
    console.log(packetList);
    return sendData(packetList);
}).catch(err => console.log("Error: "+err));
