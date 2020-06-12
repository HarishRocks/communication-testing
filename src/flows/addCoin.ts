//ToDo, create a universal coinType object for refrence in whole system
//ToDo, create a different file for all blockcypher related stuff
import { createPort } from '../communication/port';
import { xmodemDecode, xmodemEncode } from '../xmodem';
import { ackData, sendData } from '../communication/sendData';
import { commands } from '../config';
import { hexToAscii } from '../bytes';
const Datastore = require('nedb')
const base58 = require('bs58');
const bip32 = require('bip32');
const bitcoin = require('bitcoinjs-lib');
const axios = require('axios');
var crypto = require('crypto');


bitcoin.networks.litecoin = {
  messagePrefix: '\x19Litecoin Signed Message:\n',
  bip32: {
    public: 0x0488b21e,
    private: 0x0488ade4,
  },
  pubKeyHash: 0x30,
  scriptHash: 0x32,
  wif: 0xb0
};

bitcoin.networks.dash = {
  messagePrefix: 'unused',
  bip32: {
    public: 0x0488b21e,
    private: 0x0488ade4
  },
  pubKeyHash: 0x4c,
  scriptHash: 0x10,
  wif: 0xcc
};

bitcoin.networks.dogecoin = {
  messagePrefix: '\x19Dogecoin Signed Message:\n',
  bip32: {
    public: 0x02facafd,
    private: 0x02fac398
  },
  pubKeyHash: 0x1e,
  scriptHash: 0x16,
  wif: 0x9e
};


//Internal function
//@paras para1: xpub, para2: start, para3: end, para4: internal(0)/external(1)
//@return list of addresses
const __get_address_list = function (coin_type: any, xpub: any, start: any, end: any, chain: any) {
  let address_list = [];
  let node = null;
  let network = null;
  switch (coin_type) {
    case "btc":
      network = bitcoin.networks.testnet
      break;
    case "ltc":
      network = bitcoin.networks.litecoin
      break;
    case "dash":
      network = bitcoin.networks.dash
      break;
    case "doge":
      network = bitcoin.networks.dogecoin
      break;


  }
  if (network == null) {
    console.log("No Network")
    return null
  }
  node = bip32.fromBase58(xpub, network)
  for (let i = start; i < end; i++) {
    let { address } = bitcoin.payments.p2pkh({ pubkey: node.derivePath(`${chain}/${i}`).publicKey, network: network });
    address_list.push(address)
  }
  return address_list
};

const change_address_generate = (coin_type: any, xpub: any, start: any, end: any) => {
  return __get_address_list(coin_type, xpub, start, end, 1);
}

//receive address generate function
//@paras para1: xpub, para2: start, para3: end
//@return list of addresses
const receive_address_generate = (coin_type: any, xpub: any, start: any, end: any) => {
  return __get_address_list(coin_type, xpub, start, end, 0);
}



const { ACK_PACKET } = commands;

const recieveData = (connection: any, command: any) => {
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

//Push wallet to blockcypher
const uploadWallet = (name :any, addresses :any) => {

  axios.post(
    "https://api.blockcypher.com/v1/btc/test3/wallets?token=5849c99db61a468db0ab443bab0a9a22",
    {
      "name":name,
      "addresses":addresses
    }
  ).then(function(response : any){
    console.log("Adding a new wallet suceessful");
  }).catch(function(error : any){
    console.log("An error occured:"+error);
  });
}


//ToDo discuss with shreyas the format of recieving data
const addXPubsToDB = (wallet_id: any, xpubraw: any, coinType: any) => {


}

//ToDo 
const sendAddressesToServer = (xpubraw: String, coinType: any) => {
  let xpub = base58.encode(Buffer.from(xpubraw), "hex");

  let rcAddr = receive_address_generate(coinType , xpub, 0, 20);

  let chAddr = change_address_generate(coinType, xpub, 0, 20);

  let hash = crypto.createHash('sha256').update(xpub).digest('hex').slice(0,32); //because we only need the first 16 bytes

  uploadWallet(`re${hash}`, rcAddr);
  uploadWallet(`ch${chAddr}`, chAddr);

}

//To Display Added Wallets
const allAvailableWallets = () => {
  let db = new Datastore({ filename: 'db/wallet_db.db', autoload: true });
  let all_wallets;
  db.find({}, function (err: any, docs: any) {
    all_wallets = docs;
  });
  return all_wallets;
}


export const addCoin = async (wallet_id: any, coins: any) => {


  const { connection, serial } = await createPort();
  connection.open();

  // this will work only one time and will self exit to prevent memory leak
  // initiate them whenever needed to get data otherwise just ignore it

  console.log(`Desktop : Sending Ready Command.`);
  sendData(connection, 41, "00");


  let d = await recieveData(connection, 42);
  console.log('From Device: ')
  console.log(d);


  if (String(d).slice(0, 2) == "02") {
    console.log(`Desktop : Sending Wallet ID and Coins.`);
    wallet_id = "af19feeb93dfb733c5cc2e78114bf9b53cc22f3c64a9e6719ea0fa6d4ee2fe31";
    coins = ['800000'];
    let num_coins = coins.length;
    sendData(connection, 45, wallet_id + coins.join(''));


    d = await recieveData(connection, 46);
    console.log('From Device: User confirmed coins: ')
    console.log(d);

    d = await recieveData(connection, 47);
    console.log('From Device: User entered pin: ')
    console.log(d);

    d = await recieveData(connection, 48);
    console.log('From Device: User tapped cards: ')
    console.log(d);

    d = await recieveData(connection, 49);
    console.log('From Device: all xPubs')
    console.log(d);

    addXPubsToDB(wallet_id, d, coins);

    console.log(`Desktop : Sending Success Command.`);
    sendData(connection, 42, "01");
  }

  connection.close();
  connection.on('error', (d) => {
    console.log(d);
  });
};



