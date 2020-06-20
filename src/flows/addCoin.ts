//ToDo, create a universal coinType object for refrence in whole system - done
//ToDo, create a different file for all blockcypher related stuff - done
//ToDo, ask Vipul Sir if I should put a return 0/1 in addCoin to show if it was successful or failed
//ToDo, think of another file for display_all_wallets function - done
import { createPort } from '../communication/port';
import { sendData } from '../communication/sendData';
import { recieveData, recieveCommand } from '../communication/recieveData';
import { commands } from '../config';
import { default as Datastore } from 'nedb';
import { coins as COINS } from '../config';
import { Wallet , addCoinsToDB } from './wallet';
import { hexToAscii } from '../bytes';
// import { default as base58 } from 'bs58';
const base58 = require('bs58');
import deviceReady from '../communication/deviceReady';


//ToDo discuss with shreyas the format of recieving data
//Also uploads the wallet to blockcypher
const addXPubsToDB = async(wallet_id: any, xpubraw: any, coinType: any) => {

  for (let i = 0; i < (xpubraw.length / 224); i++) {
    let x = xpubraw.slice(i * 224, i * 224 + 222);
    var account_xpub = hexToAscii(x);
    
    await addCoinsToDB(wallet_id,account_xpub,coinType[i]);


    let w = new Wallet(account_xpub, coinType[i]);
    let re_addr = w.address_list(0, 0, 20);
    let ch_addr = w.address_list(1, 0, 20);
    w.upload_wallet(w.external, re_addr);
    w.upload_wallet(w.internal, ch_addr);
    // console.log(w.external);
    // console.log(w.internal);
  }
}


const makeCoinIndexList = (coinTypes : any) => {
  let coinsIndexList : any = [];

  for( let i in coinTypes ){
    let coinType = coinTypes[i];
    if (coinType === COINS.BTC) //x  
			coinsIndexList[i] = "80000000";
		if (coinType === COINS.BTC_TESTNET)
			coinsIndexList[i] = "80000001";
		if (coinType === COINS.LTC)
			coinsIndexList[i] = "80000002";
		if (coinType === COINS.DASH)
			coinsIndexList[i] = "80000005";
		if (coinType === COINS.DOGE)
			coinsIndexList[i] = "80000003";
  }
  return coinsIndexList;
}


export const addCoin = async (wallet_id: any, coinTypes: any) => {


  const { connection, serial } = await createPort();
  connection.open();

  const ready = await deviceReady(connection);


  //Only if device is ready.
  if (ready) {

    console.log(`Desktop : Sending Wallet ID and Coins.`);
    // wallet_id = "af19feeb93dfb733c5cc2e78114bf9b53cc22f3c64a9e6719ea0fa6d4ee2fe31";
    let coins = makeCoinIndexList(coinTypes);
    let num_coins = coins.length;
    await sendData(connection, 45, wallet_id + coins.join(''));
    console.log("Message: " + wallet_id + coins.join('') + "\n\n");

    const coinsConfirmed = await recieveCommand(connection, 46);
    console.log('From Device: User confirmed coins: ')
    console.log(coinsConfirmed);

    // const pinEnteredPin = await recieveCommand(connection, 47);
    // console.log('From Device: User entered pin: ')
    // console.log(pinEnteredPin);

    const tappedCards = await recieveCommand(connection, 48);
    console.log('From Device: User tapped cards: ')
    console.log(tappedCards);

    const xPubDetails = await recieveCommand(connection, 49);
    console.log('From Device: all xPubs')
    console.log(xPubDetails);

    await addXPubsToDB(wallet_id, xPubDetails, coinTypes);

    console.log(`Desktop : Sending Success Command.`);
    await sendData(connection, 42, "01");
  }
  else {
    console.log("Device not ready");
  }


  connection.close();
  connection.on('error', (d) => {
    console.log(d);
  });
};



