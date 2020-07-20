import { createPort } from '../core/port';
import { sendData } from '../core/sendData';
import { receiveCommand } from '../core/recieveData';
import { coins as COINS } from '../config';
import {
  Wallet,
  addCoinsToDB,
  allAvailableWallets,
  getCoinsFromWallet,
  pinSetWallet,
} from './wallet';
import { hexToAscii } from '../bytes';
import deviceReady from '../core/deviceReady';
import { query_list, query_checkbox } from './cli_input';
// @ts-ignore
import * as logs from 'simple-node-logger';

const log = logs.createSimpleFileLogger('project.log');

/**
 * Adds xpubs database and uploads them.
 *
 * @remarks
 * Adds the raw xpubs obtained from the device to the database and also uploads them to the blockcypher website.
 * Each xpub is in base58 encoded format, but in hexadecimal.
 *
 * @param wallet_id - Wallet id to refrence a wallet from the database
 *
 * @param xpubraw  - Raw string containing multiple xpubs in hex format.
 *
 * @param coinTypes - List of coin types for the corrosponding xpub
 *
 */
const addXPubsToDB = async (wallet_id: any, xpubraw: any, coinTypes: any) => {
  for (let i = 0; i < xpubraw.length / 224; i++) {
    const x = xpubraw.slice(i * 224, i * 224 + 222);
    const account_xpub = hexToAscii(x);

    await addCoinsToDB(wallet_id, account_xpub, coinTypes[i]);

    //only push them to blockcypher if they're not ethereum coins
    if (!(coinTypes[i] === COINS.ETH)) {
      const w = new Wallet(account_xpub, coinTypes[i]);
      const re_addr = w.address_list(0, 0, 20);
      const ch_addr = w.address_list(1, 0, 20);
      w.upload_wallet(w.external, re_addr);
      w.upload_wallet(w.internal, ch_addr);
      // console.log(w.external);
      // console.log(w.internal);
    }
  }
};

/**
 * Makes the coin index list.
 *
 * @remarks
 * Takes the array containing the coin names and converts them into an array of the corrosponding coin indexes.
 * Example : bitcoin is converted to 80000000
 *
 * @param coinTypes - Array containing the coin names
 *
 * @returns - Array containing the coin indexes
 */
const makeCoinIndexList = (coinTypes: any) => {
  const coinsIndexList: any = [];

  for (const i in coinTypes) {
    if (coinTypes.hasOwnProperty(i)) {
      const coinType = coinTypes[i];
      if (coinType === COINS.BTC) coinsIndexList[i] = '80000000';
      else if (coinType === COINS.BTC_TESTNET) coinsIndexList[i] = '80000001';
      else if (coinType === COINS.LTC) coinsIndexList[i] = '80000002';
      else if (coinType === COINS.DASH) coinsIndexList[i] = '80000005';
      else if (coinType === COINS.DOGE) coinsIndexList[i] = '80000003';
      // else if(coinType === COINS.ETH) coinsIndexList[i] = '8000003c';
      else throw new Error('Wrong Coin Type Provided');
    }
  }
  return coinsIndexList;
};

/**
 * Returns a list of available wallets with its id.
 *
 * @remarks
 * Format
 * ```ts
 * [
 *   {
 *      name : "Savings",
 *      value : "e80053381bceb08732024f10af80053aedc48fbc51c8e4cb6a10d22bc814892c"
 *   },
 *   {
 *      name : "Secret",
 *      value : "f80053381bcea08732024f10af81053aedc48fbc51c8e4cb6a10d22bc8148312"
 *   }
 * ]
 * ```
 *
 * @returns List of objects containing wallet names and ids.
 *
 */
export const allWalletsList = async () => {
  let wallets: any;
  wallets = await allAvailableWallets();
  const displayWallets: any = [];

  // make a list for inquirer with name and ID.
  wallets.forEach((element: any) => {
    displayWallets.push({
      name: element.name,
      value: element._id,
    });
  });
  console.log(displayWallets);
  return displayWallets;
};

/**
 * Returns a list of objects with coins which are not added in a wallet.
 *
 * @remarks
 * This function is used to return a list for the CLI interface. It returns a list of all coins.
 * The coins which are already added in the wallet provided, will have an extra property called 'disabled' to prevent the user from selecting it.
 * This object is used in the inquirerjs library to render the CLI.
 *
 * @param walletID - Wallet id to refrence a wallet from the database
 *
 * @returns List of objects containing coin names.
 */
export const coinsNotAdded = async (walletID: any) => {
  const addedCoins: any = await getCoinsFromWallet(walletID);
  // console.log(addedCoins);
  const allCoins: any = [
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
    // {
    //   name : 'ETHEREUM',
    //   value : COINS.ETH,
    // },
  ];

  for (const i in allCoins) {
    if (addedCoins.indexOf(allCoins[i].value) > -1) {
      allCoins[i].disabled = 'Already Added';
      // console.log("Ping")
    }
  }

  return allCoins;
};

/**
 * Adds coins and their corrosponding xpubs to the database.
 *
 * @remarks
 * Sends the coin indexes to the hardware, which returns the corrosponding xpubs and we store it in the database and upload it to the server.
 * @param walletID - Wallet Id of the wallet in which coins are to be added.
 * @param coinTypes - The coin types which are to be added.
 */

export const addCoin = async (walletID: any, coinTypes: any) => {
  const { connection, serial } = await createPort();
  connection.open();

  // If CLI, take input from user.
  if (process.env.NODE_ENV!.trim() === 'cli') {
    const available_coins = await coinsNotAdded(walletID);

    coinTypes = await query_checkbox(available_coins, 'Choose your coins');
  }

  const ready = await deviceReady(connection);

  // Only if device is ready.
  if (ready) {
    console.log(`Desktop : Sending Wallet ID and Coins.`);

    const coins = makeCoinIndexList(coinTypes);
    const num_coins = coins.length;
    await sendData(connection, 45, walletID + coins.join(''));
    console.log('Message: ' + walletID + coins.join('') + '\n\n');

    const coinsConfirmed: any = await receiveCommand(connection, 46);
    if (!!parseInt(coinsConfirmed, 10)) {
      console.log('From Device: User confirmed coins');
    } else {
      console.log(
        'From Device: User did not confirm coins.\nExiting Function...'
      );
      connection.close();
      return 0;
    }

    // if(await pinSetWallet(wallet_id)){
    //   const pinEnteredPin = await receiveCommand(connection, 47);
    //   console.log('From Device: User entered pin: ')
    //   console.log(pinEnteredPin);
    // }

    const tappedCards = await receiveCommand(connection, 48);
    console.log('From Device: User tapped cards: ');
    console.log(tappedCards);

    const xPubDetails = await receiveCommand(connection, 49);
    console.log('From Device: all xPubs');
    console.log(xPubDetails);

    await addXPubsToDB(walletID, xPubDetails, coinTypes);

    console.log(`Desktop : Sending Success Command.`);
    await sendData(connection, 42, '01');
  } else {
    console.log('Device not ready');
    connection.close();
    return 0;
  }

  connection.close();
  connection.on('error', (d) => {
    console.log(d);
  });
};
