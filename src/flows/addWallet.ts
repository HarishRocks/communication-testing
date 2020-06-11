import { createPort } from '../communication/port';
import { xmodemDecode , xmodemEncode } from '../xmodem';
import { ackData , sendData } from '../communication/sendData';
import { commands } from '../config';
import { hexToAscii } from '../bytes';
const Datastore = require('nedb')
const { ACK_PACKET } = commands;


const recieveData = (connection: any, command : any) => {
  const resData: any = [];
  return new Promise((resolve, reject) => {
    connection.on('data', (packet: any) => {
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
            connection.removeAllListeners('data')
            resolve(resData.join(''));
          }
        }
      });
    });
  });
};

//Author: Gaurav Agarwal
//@method Takes raw data, converts the name from hex to String, and keeps the id in hex itself, and stores it in the database.
//@var rawData : hex data from device
const addWalletToDB = (rawData : any) => {
  let db = new Datastore({ filename: 'db/wallet_db.db', autoload: true });

  let name = hexToAscii(String(rawData).slice(0,32));
  let passwordSet = String(rawData).slice(32,34);
  let _id = String(rawData).slice(34);

  db.insert({name : name, passwordSet : passwordSet, _id : _id});
}


//Todo in this function, Replace all the commands with their const values. Example, 42 -> Status Command.
export const addWallet = async () => {

  const { connection, serial } = await createPort();
  connection.open();

  // this will work only one time and will self exit to prevent memory leak
  // initiate them whenever needed to get data otherwise just ignore it

  console.log(`Desktop : Sending Ready Command.\n\n`);
  await sendData(connection, 41, "00");
  
  //recieving Success Status Command (Value = 2)
  let d = await recieveData(connection, 42);
  console.log('From Device: ')
  console.log(d);

  //only proceed if device is ready, else quit.
  if(String(d).slice(0,2) == "02")
  {
    console.log(`\n\nDesktop : Sending Add Wallet Command.\n\n`);
    await sendData(connection, 43, "00");

    
    // Example data to be recieved in hex 4142434400000000000000000000000000af19feeb93dfb733c5cc2e78114bf9b53cc22f3c64a9e6719ea0fa6d4ee2fe31
    console.log('Wallet Details From Device: ');
    d = await recieveData(connection, 44);
    console.log(d);

    addWalletToDB(d);

    console.log(`\n\nDesktop : Sending Success Command.`);
    await sendData(connection, 42, "01");
  }

  connection.close();
  connection.on('error', (d) => {
    console.log(d);
  });
}


//ONLY FOR TESTING PURPOSES RIGHT NOW
export const addWalletDeviceInitiated = async () => {

  const { connection, serial } = await createPort();
  connection.open();

  // this will work only one time and will self exit to prevent memory leak
  // initiate them whenever needed to get data otherwise just ignore it

  console.log('Wallet Details From Device: ');
  let d = await recieveData(connection, 44);
  console.log(d);


  console.log(`\n\nDesktop : Sending Success Command.`);
  await sendData(connection, 42, "01");

  connection.close();
  connection.on('error', (d) => {
    console.log(d);
  });
}