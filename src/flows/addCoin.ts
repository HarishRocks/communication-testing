import { createPort } from '../communication/port';
import { xmodemDecode , xmodemEncode } from '../xmodem';
import { ackData , sendData } from '../communication/sendData';
import { commands } from '../config';
import { hexToAscii } from '../bytes';
const Wallet = require('wallet');
const Datastore = require('nedb')
const base58 = require('bs58');


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

//ToDo discuss with shreyas the format of recieving data
const addXPubsToDB = (wallet_id : any, xpubraw : any, coinType : any) => {
 

}

const allAvailableWallets = () => {
  let db = new Datastore({ filename: 'db/wallet_db.db', autoload: true });
  let all_wallets;
  db.find({}, function (err : any , docs : any){
    all_wallets = docs;
  });
  return all_wallets;
}

export const addCoin = async (wallet_id : any , coins : any) => {


  const { connection, serial } = await createPort();
  connection.open();

  // this will work only one time and will self exit to prevent memory leak
  // initiate them whenever needed to get data otherwise just ignore it

  console.log(`Desktop : Sending Ready Command.`);
  sendData(connection, 41, "00");


  let d = await recieveData(connection, 42);
  console.log('From Device: ')
  console.log(d);


  if(String(d).slice(0,2) == "02")
  {
    console.log(`Desktop : Sending Wallet ID and Coins.`);
    wallet_id = "af19feeb93dfb733c5cc2e78114bf9b53cc22f3c64a9e6719ea0fa6d4ee2fe31" ;
    coins = ['800000'];
    sendData(connection, 45, wallet_id + coins.join('')); 
  
  
    d = await recieveData(connection , 46);
    console.log('From Device: User confirmed coins: ')
    console.log(d);
  
    d = await recieveData(connection , 47);
    console.log('From Device: User entered pin: ')
    console.log(d);
  
    d = await recieveData(connection , 48);
    console.log('From Device: User tapped cards: ')
    console.log(d);
  
    d = await recieveData(connection , 49);
    console.log('From Device: all xPubs')
    console.log(d);
  
    addXPubsToDB(wallet_id, d, coins);
  
    console.log(`Desktop : Sending Success Command.`);
    sendData(connection, 42, "01");
  }



  


  /**
   * Code below is just to create hardware output doc
   * Don't remove & don't use
   */

  // connection.on('data', (d) => {
  //   const data = xmodemDecode(d);
  //   data.forEach((d) => {
  //     const { commandType, currentPacketNumber } = d;
  //     const ackPacket = ackData(
  //       ACK_PACKET,
  //       `0x${currentPacketNumber.toString(16)}`
  //     );
  //     connection.write(Buffer.from(`aa${ackPacket}`, 'hex'));
  //     console.log(d);
  //   });
  // });
  connection.on('error', (d) => {
    console.log(d);
  });
};



