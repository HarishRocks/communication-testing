//ToDo ask suraj sir about the added_coins in recievetransaction flow
import { addWallet, addWalletDeviceInitiated } from './flows/addWallet';
import { addCoin } from './flows/addCoin';
import cardAuth from './flows/cardAuth';
import { coins as COINS } from './config';
import {
  allAvailableWallets,
  Wallet,
  getCoinsFromWallet,
} from './flows/wallet';

import { sendTransaction, getCoinType } from './flows/sendTransaction';

const inquirer = require('inquirer');
import elliptic from 'elliptic';
import { recieveTransaction } from './flows/recieveTransaction';

const getCoin = async (xyz: String, handle: any) => {
  console.log(xyz);
  xyz = 'asdfasdfasdfasdf';
  if (process.env.NODE_ENV == 'cli') {
    xyz = handle(xyz);
    console.log(xyz);
  }
};

getCoin('abc', (d: String) => {
  console.log(d);
  return 'Modified';
});

const query = async (selections: any[], type: String = 'list') => {
  const q = await inquirer.prompt([
    {
      type: type,
      name: 'choice',
      message: 'Select your option',
      choices: selections,
    },
  ]);
  return q.choice;
};

console.log(process.env.NODE_ENV);

(async () => {
  let selection = await query([
    'Select Wallet',
    'Add Wallet',
    'Card Authentication',
  ]);

  switch (selection) {
    case 'Select Wallet':
      await addWallet();
      break;
    case 'Add Wallet':
      await addWallet();
      break;
    case 'Card Authentication':
      await cardAuth();
      break;
  }
})().catch((err) => console.log(err));

// (async () => {
//   let selection = await inquirer.prompt([
//     {
//       type: 'list',
//       name: 'choice',
//       message: 'Select your option',
//       choices: ['Select Wallet', 'Add Wallet', 'Card Authentication'],
//     },
//   ]);

//   if (selection.choice === 'Add Wallet') {
//     await addWallet();
//   } else if (selection.choice === 'Select Wallet') {
//     let wallets: any;
//     wallets = await allAvailableWallets();
//     // console.log(wallets);
//     let display_wallets: any = [];

//     //make a list for inquirer with name and ID.
//     wallets.forEach((element: any) => {
//       display_wallets.push({
//         name: element.name,
//         value: element._id,
//       });
//     });

//     // console.log(display_wallets);
//     // console.log(display_wallets[0].name);

//     selection = await inquirer.prompt([
//       {
//         type: 'list',
//         name: 'selectedWallet',
//         message: 'Select your wallet',
//         choices: display_wallets,
//       },
//     ]);

//     const wallet_id = selection.selectedWallet;

//     selection = await inquirer.prompt([
//       {
//         type: 'list',
//         name: 'walletAction',
//         message: 'Choose your action',
//         choices: ['Add Coin', 'Send Transaction', 'Recieve Transaction'],
//       },
//     ]);

//     switch (selection.walletAction) {
//       case 'Add Coin':
//         // console.log('Wallet Id' + wallet_id);
//         let added_coins: any = await getCoinsFromWallet(wallet_id);
//         // console.log(added_coins);
//         let all_coins: any = [
//           {
//             name: 'BITCOIN',
//             value: COINS.BTC,
//           },
//           {
//             name: 'BITCOIN TESTNET',
//             value: COINS.BTC_TESTNET,
//           },
//           {
//             name: 'LITECOIN',
//             value: COINS.LTC,
//           },
//           {
//             name: 'DOGECOIN',
//             value: COINS.DOGE,
//           },
//           {
//             name: 'DASHCOIN',
//             value: COINS.DASH,
//           },
//         ];

//         for (let i in all_coins) {
//           if (added_coins.indexOf(all_coins[i].value) > -1) {
//             all_coins[i].disabled = 'Already Added';
//             // console.log("Ping")
//           }
//         }

//         // console.log(all_coins);

//         selection = await inquirer.prompt([
//           {
//             type: 'checkbox',
//             message: 'Select coins to add',
//             name: 'new_coins',
//             choices: all_coins,
//           },
//         ]);

//         await addCoin(wallet_id, selection.new_coins);

//         break;

//       case 'Send Transaction':
//         selection = await inquirer.prompt([
//           {
//             type: 'input',
//             message: 'Input the Reciepient Address',
//             name: 'rec_addr',
//           },
//           {
//             type: 'number',
//             message: 'Input the amount',
//             name: 'send_amount',
//           },
//         ]);

//         const coinType = getCoinType(selection.rec_addr);

//         const output_list = [
//           {
//             address: selection.rec_addr,
//             value: selection.send_amount,
//           },
//         ];

//         while (1) {
//           selection = await inquirer.prompt([
//             {
//               type: 'list',
//               message: 'Do you want to add more addresses?',
//               name: 'choice',
//               choices: ['yes', 'no'],
//             },
//           ]);

//           if (selection.choice == 'yes') {
//             selection = await inquirer.prompt([
//               {
//                 type: 'input',
//                 message: 'Input the Reciepient Address',
//                 name: 'rec_addr',
//               },
//               {
//                 type: 'number',
//                 message: 'Input the amount',
//                 name: 'send_amount',
//               },
//             ]);

//             let tempCoinType = getCoinType(selection.rec_addr);

//             if (coinType === tempCoinType) {
//               output_list.push({
//                 address: selection.rec_addr,
//                 value: selection.send_amount,
//               });
//             } else {
//               console.log(
//                 'Please enter an addresses for the same coinType as above.\n'
//               );
//             }
//           } else {
//             break;
//           }
//         }

//         await sendTransaction(wallet_id, output_list, coinType);
//         break;

//       case 'Recieve Transaction':
//         let added_coins1: any = await getCoinsFromWallet(wallet_id);
//         // console.log(added_coins);
//         let all_coins1: any = [
//           {
//             name: 'BITCOIN',
//             value: COINS.BTC,
//           },
//           {
//             name: 'BITCOIN TESTNET',
//             value: COINS.BTC_TESTNET,
//           },
//           {
//             name: 'LITECOIN',
//             value: COINS.LTC,
//           },
//           {
//             name: 'DOGECOIN',
//             value: COINS.DOGE,
//           },
//           {
//             name: 'DASHCOIN',
//             value: COINS.DASH,
//           },
//         ];

//         for (let i in all_coins1) {
//           if (added_coins1.indexOf(all_coins1[i].value) == -1) {
//             delete all_coins1[i];
//             // console.log("Ping")
//           }
//         }

//         // console.log(all_coins1.filter(Boolean));
//         selection = await inquirer.prompt([
//           {
//             type: 'list',
//             message: 'Select Coin type',
//             name: 'coinType',
//             choices: all_coins1.filter(Boolean),
//           },
//         ]);

//         await recieveTransaction(wallet_id, selection.coinType);
//         break;

//       default:
//         break;
//     }
//   } else if (selection.choice === 'Card Authentication') {
//     await cardAuth();
//   }
// })().catch((err) => console.log(err));
