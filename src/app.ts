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

if (process.env.NODE_ENV!.trim() === 'cli') {
  cli_tool().catch((err) => console.log(err));
}

export {
  sendData,
  recieveCommand,
  recieveData,
  addWallet,
  addCoin,
  sendTransaction,
  recieveTransaction,
  wallet,
  createPort
};
