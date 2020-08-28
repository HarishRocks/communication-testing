// ToDo, create a universal coinType object for refrence in whole system - done (kind of)
// ToDo, if user enters same address twice, instead of making two output fields, make 1 output field with added balance, or give the user an error.
import { createPort } from '../core/port';
import { sendData } from '../core/sendData';
import { coins as COINS } from '../config';
import { recieveData, receiveCommand } from '../core/recieveData';
import {
  getXpubFromWallet,
  Wallet,
  pinSetWallet,
  balanceAllCoins,
  displayAllBalance,
} from './wallet';
import { default as base58 } from 'bs58';
import { default as Datastore } from 'nedb';
import deviceReady from '../core/deviceReady';
import axios from 'axios';
//@ts-ignore
import * as logs from 'simple-node-logger';
const log = logs.createSimpleFileLogger('project.log');

// Bitcoin (Mainnet) - 00
// Bitcoin (Testnet) - 6f
// Litecoin - 30
// Dash - 4c
// Doge - 1e

// Get Coin type from address
export const getCoinType = (address: string) => {
  const decodedString = base58.decode(address).toString('hex');
  const addressVersion = decodedString.slice(0, 2);

  if (addressVersion === '00') return COINS.BTC;
  else if (addressVersion === '6f') return COINS.BTC_TESTNET;
  else if (addressVersion === '30') return COINS.LTC;
  else if (addressVersion === '4c') return COINS.DASH;
  else if (addressVersion === '1e') return COINS.DOGE;
  //to-do this is temporary
  // else if(address.slice(0,2) === "0x") return COINS.ETH;
  else throw new Error('Invalid Address Type');
};

const broadcastTransaction = (transaction: any) => {
  console.log('Only for btc testnet for now');
  axios
    .post('https://api.blockcypher.com/v1/btc/test3/txs/push', {
      tx: transaction,
    })
    .then((res: any) => {
      log.info(JSON.stringify(res.data));
      if (res.data.tx.hash) {
        console.log('Transaction Hash :' + res.data.tx.hash);
        return 1;
      } else {
        return 0;
      }
    })
    .catch((err) => {
      console.log('An error occured');
      return 0;
    });
};

// Output list is
// let output = [
// {
//     "address":output_address,
//     "value":amount
// }];
export const sendTransaction = async (
  wallet_id: any,
  output_list: any,
  coinType: any,
  fee_rate: any
) => {
  // will get xPub from wallet_id and the coin_type

  const { connection, serial } = await createPort();
  connection.open();

  const ready = await deviceReady(connection);

  if (ready) {
    const xpub = await getXpubFromWallet(wallet_id, coinType);

    //ToDo: check if xpub is generated, if not, give error.
    const wallet = new Wallet(xpub, coinType);
    if (!(await wallet.funds_check(output_list))) {
      console.log('Funds not sufficient');
      connection.close();
      return 0;
    }
    const txn_metadata = await wallet.generateMetaData(output_list);

    console.log('Destop : Sending Wallet ID and Txn Metadata.');
    console.log('Wallet id: ' + wallet_id);
    console.log('Transaction Metadata' + txn_metadata);
    await sendData(connection, 50, wallet_id + txn_metadata);

    const coinConfirmed: any = await receiveCommand(connection, 51);
    if (!!parseInt(coinConfirmed, 10)) {
      console.log('From Device: User confirmed coin.');
    } else {
      console.log(
        'From Device: User did not confirm coin.\nExiting Function...'
      );
      connection.close();
      return 0;
    }

    const unsigned_txn: any = await wallet.generateUnsignedTransaction(
      output_list,
      'm'
    );

    console.log('Destop : Sending Unsigned Transaction.');
    console.log('Unsigned Transaction' + unsigned_txn);
    await sendData(connection, 52, unsigned_txn);

    const reciepentVerified = await receiveCommand(connection, 53);
    console.log('From Device (User verified reciepient amount and address) : ');
    console.log(reciepentVerified);

    // if (await pinSetWallet(wallet_id)) {
    //     const pinEnteredPin = await receiveCommand(connection, 47);
    //     console.log('From Device: User entered pin: ')
    //     console.log(pinEnteredPin);
    // }

    const cardsTapped = await receiveCommand(connection, 48);
    console.log('From Device (Cards are tapped) : ');
    console.log(cardsTapped);

    const signedTransaction = await receiveCommand(connection, 54);
    console.log('From Device (Signed Transaction) : ');
    console.log(signedTransaction);

    const s: any = broadcastTransaction(signedTransaction);

    if (s === 1) {
      await sendData(connection, 42, '01');
    } else {
      console.log('Boradcast Unsuccessful');
    }
  } else {
    console.log('Device not ready');
  }
  connection.close();
};
