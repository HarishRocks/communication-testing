// ToDo ask suraj sir about the added_coins in receiveTransaction flow
import dotenv from 'dotenv-flow';
dotenv.config();

import { receiveCommand, recieveData } from './core/recieveData';
import { sendData } from './core/sendData';

import * as addWallet from './flows/addWallet';
import * as addCoin from './flows/addCoin';
import * as sendTransaction from './flows/sendTransaction';
import * as receiveTransaction from './flows/receiveTransaction';
import * as wallet from './flows/wallet';
import { createPort } from './core/port';
import deviceReady from './core/deviceReady';

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
  receiveCommand,
  recieveData,
  addWallet,
  addCoin,
  sendTransaction,
  receiveTransaction,
  wallet,
  createPort,
  deviceReady,
};
