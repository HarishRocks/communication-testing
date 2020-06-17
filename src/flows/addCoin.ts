//ToDo, create a universal coinType object for refrence in whole system
//ToDo, create a different file for all blockcypher related stuff
//ToDo, ask Vipul Sir if I should put a return 0/1 in addCoin to show if it was successful or failed
//ToDo, think of another file for display_all_wallets function.
import { createPort } from '../communication/port';
import { sendData } from '../communication/sendData';
import { recieveData, recieveCommand } from '../communication/recieveData';
import { commands } from '../config';
const Datastore = require('nedb');
const axios = require('axios');
import { coins as COINS } from '../config';
// import { Wallet } from './wallet';
const Wallet = require('./wallet')
const base58 = require('bs58');

//ToDo discuss with shreyas the format of recieving data
//Also uploads the wallet to blockcypher
const addXPubsToDB = (wallet_id: any, xpubraw: any, coinType: any) => {
  let db = new Datastore({ filename: 'db/wallet_db.db', autoload: true });

  
  for ( let i = 0; i < ( xpubraw.length/82); i++ )
  {
    let x = xpubraw.slice ( i*82 , i*82 + 82 );
    var account_xpub = base58.encode(Buffer.from(x, 'hex'));

    db.update({ _id: wallet_id }, { $push: { xpubs: {coinType : coinType[i] , xPub : account_xpub} } }, {}, function () {
      console.log(`Added xPub : ${account_xpub} to the database.`);
    });

    let w = new Wallet(account_xpub, coinType[i]);
    let re_addr = w.address_list(0,0,20);
    let ch_addr = w.address_list(1,0,20);
    w.upload_wallet(w.external , re_addr);
    w.upload_wallet(w.internal, ch_addr);
  }
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


  let d = await recieveCommand(connection, 42);
  console.log('From Device: ')
  console.log(d);


  //Only if device is ready.
  if (String(d).slice(0, 2) == "02") {

    console.log(`Desktop : Sending Wallet ID and Coins.`);
    wallet_id = "af19feeb93dfb733c5cc2e78114bf9b53cc22f3c64a9e6719ea0fa6d4ee2fe31";
    coins = ['80000000'];
    let coinTypes = [COINS.BTC];
    let num_coins = coins.length;
    sendData(connection, 45, wallet_id + coins.join(''));


    d = await recieveCommand(connection, 46);
    console.log('From Device: User confirmed coins: ')
    console.log(d);

    d = await recieveCommand(connection, 47);
    console.log('From Device: User entered pin: ')
    console.log(d);

    d = await recieveCommand(connection, 48);
    console.log('From Device: User tapped cards: ')
    console.log(d);

    d = await recieveCommand(connection, 49);
    console.log('From Device: all xPubs')
    console.log(d);

    addXPubsToDB(wallet_id, d, coinTypes);

    console.log(`Desktop : Sending Success Command.`);
    sendData(connection, 42, "01");
  }
  else {
    console.log("Device not ready");
  }


  connection.close();
  connection.on('error', (d) => {
    console.log(d);
  });
};



