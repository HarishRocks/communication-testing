// ToDo ask suraj sir about the added_coins in recievetransaction flow
import cli_tool from './cli';

import { recieveCommand, recieveData } from './communication/recieveData';
import { sendData } from './communication/sendData';

import * as addWallet from './flows/addWallet';
import * as addCoin from './flows/addCoin';
import * as sendTransaction from './flows/sendTransaction';
import * as recieveTransaction from './flows/recieveTransaction';
import * as wallet from './flows/wallet';
import { createPort } from './communication/port';
import deviceReady from './communication/deviceReady';

let node_env = process.env.NODE_ENV || '';
if (node_env.trim() === 'cli') {
  cli_tool().catch((err) => console.log(err));
}

// let w = new wallet.Wallet("tpubDC7TjLNgMvhFo78ccmP9anwZC3PEvi4pGa1ivcbij1vEkCjp377eJgJb5cKrb9LudNnV2cbUjrPzatYYrJkqtiS6hfV4JKXvy7TY26RjBrg" , "btct");
// const targets = [
//   {
//     "address" : "n3A6ysiw1u8wV6d1YZQ5GSETBkcjkrD3Dr",
//     "value" : 600,
//   },
// ]
// w.generateMetaData(targets).then( (res:any) => console.log(res)).catch( (err : any) => console.log(err));
// w.generateUnsignedTransaction(targets , 'm').then( (res:any) => console.log(res)).catch( (err : any) => console.log(err));

export {
  sendData,
  recieveCommand,
  recieveData,
  addWallet,
  addCoin,
  sendTransaction,
  recieveTransaction,
  wallet,
  createPort,
  deviceReady,
};
