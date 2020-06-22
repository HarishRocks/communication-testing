import { createPort } from '../communication/port';
import { sendData } from '../communication/sendData';
import { recieveCommand } from '../communication/recieveData';
import { coins as COINS } from '../config';
import { Wallet, addCoinsToDB, allAvailableWallets, getCoinsFromWallet, pinSetWallet } from './wallet';
import { hexToAscii } from '../bytes';
const base58 = require('bs58');
import deviceReady from '../communication/deviceReady';
import { query_list, query_checkbox } from './cli_input';



//Also uploads the wallet to blockcypher
const addXPubsToDB = async (wallet_id: any, xpubraw: any, coinType: any) => {
  for (let i = 0; i < xpubraw.length / 224; i++) {
    let x = xpubraw.slice(i * 224, i * 224 + 222);
    var account_xpub = hexToAscii(x);

    await addCoinsToDB(wallet_id, account_xpub, coinType[i]);

    let w = new Wallet(account_xpub, coinType[i]);
    let re_addr = w.address_list(0, 0, 20);
    let ch_addr = w.address_list(1, 0, 20);
    w.upload_wallet(w.external, re_addr);
    w.upload_wallet(w.internal, ch_addr);
    // console.log(w.external);
    // console.log(w.internal);
  }
};



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




//Only for CLI, Can be used for GUI if compatible.
export const allWalletsList = async () => {
  let wallets: any;
  wallets = await allAvailableWallets();
  let display_wallets: any = [];

  //make a list for inquirer with name and ID.
  wallets.forEach((element: any) => {
    display_wallets.push({
      name: element.name,
      value: element._id,
    });
  });

  return display_wallets;
}

export const coinsNotAdded = async (wallet_id: any) => {

  let added_coins: any = await getCoinsFromWallet(wallet_id);
  // console.log(added_coins);
  let all_coins: any = [
    {
      name: 'BITCOIN',
      value: COINS.BTC,
    },
    {
      name: 'BITCOIN TESTNET',
      value: COINS.BTC_TESTNET,
    },
    {
      name: 'LITECOIN',
      value: COINS.LTC,
    },
    {
      name: 'DOGECOIN',
      value: COINS.DOGE,
    },
    {
      name: 'DASHCOIN',
      value: COINS.DASH,
    },
  ];

  for (let i in all_coins) {
    if (added_coins.indexOf(all_coins[i].value) > -1) {
      all_coins[i].disabled = 'Already Added';
      // console.log("Ping")
    }
  }

  return all_coins;
}


export const addCoin = async (wallet_id: any, coinTypes: any) => {
  const { connection, serial } = await createPort();
  connection.open();


  //If CLI, take input from user.
  if (process.env.NODE_ENV == 'cli') {
    const available_coins = await coinsNotAdded(wallet_id);

    coinTypes = await query_checkbox(available_coins , 'Choose your coins');

  }

  const ready = await deviceReady(connection);

  //Only if device is ready.
  if (ready) {
    console.log(`Desktop : Sending Wallet ID and Coins.`);
    // wallet_id = "af19feeb93dfb733c5cc2e78114bf9b53cc22f3c64a9e6719ea0fa6d4ee2fe31";
    let coins = makeCoinIndexList(coinTypes);
    let num_coins = coins.length;
    await sendData(connection, 45, wallet_id + coins.join(''));
    console.log('Message: ' + wallet_id + coins.join('') + '\n\n');

    const coinsConfirmed = await recieveCommand(connection, 46);
    console.log('From Device: User confirmed coins: ');
    console.log(coinsConfirmed);

    if(await pinSetWallet(wallet_id)){
      const pinEnteredPin = await recieveCommand(connection, 47);
      console.log('From Device: User entered pin: ')
      console.log(pinEnteredPin);
    }
    

    const tappedCards = await recieveCommand(connection, 48);
    console.log('From Device: User tapped cards: ');
    console.log(tappedCards);

    const xPubDetails = await recieveCommand(connection, 49);
    console.log('From Device: all xPubs');
    console.log(xPubDetails);

    await addXPubsToDB(wallet_id, xPubDetails, coinTypes);

    console.log(`Desktop : Sending Success Command.`);
    await sendData(connection, 42, '01');
  } else {
    console.log('Device not ready');
  }

  connection.close();
  connection.on('error', (d) => {
    console.log(d);
  });
};
