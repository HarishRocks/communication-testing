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

import { sendTransaction , getCoinType } from './flows/sendTransaction';

const inquirer = require('inquirer');
import elliptic from 'elliptic';
import { recieveTransaction } from './flows/recieveTransaction';

(async () => {
  let selection = await inquirer.prompt([
    {
      type: 'list',
      name: 'choice',
      message: 'Select your option',
      choices: ['Select Wallet', 'Add Wallet', 'Card Authentication'],
    },
  ]);

  if (selection.choice === 'Add Wallet') {
    await addWallet();
  } else if (selection.choice === 'Select Wallet') {
    let wallets: any;
    wallets = await allAvailableWallets();
    // console.log(wallets);
    let display_wallets: any = [];

    //make a list for inquirer with name and ID.
    wallets.forEach((element: any) => {
      display_wallets.push({
        name: element.name,
        value: element._id,
      });
    });

    // console.log(display_wallets);
    // console.log(display_wallets[0].name);

    selection = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedWallet',
        message: 'Select your wallet',
        choices: display_wallets,
      },
    ]);

    const wallet_id = selection.selectedWallet;

    selection = await inquirer.prompt([
      {
        type: 'list',
        name: 'walletAction',
        message: 'Choose your action',
        choices: ['Add Coin', 'Send Transaction', 'Recieve Transaction'],
      },
    ]);

    switch (selection.walletAction) {
      case 'Add Coin':
        // console.log('Wallet Id' + wallet_id);
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

        // console.log(all_coins);

        selection = await inquirer.prompt([
          {
            type: 'checkbox',
            message: 'Select coins to add',
            name: 'new_coins',
            choices: all_coins,
          },
        ]);

        await addCoin(wallet_id, selection.new_coins);

        break;

      case 'Send Transaction':

        selection = await inquirer.prompt([
          {
            type: 'input',
            message: 'Input the Reciepient Address',
            name: 'rec_addr'
          },
          {
            type: 'number',
            message: "Input the amount",
            name: 'send_amount'
          }
        ]);

        const coinType = getCoinType(selection.rec_addr);

        const output_list = [{
          address : selection.rec_addr,
          value : selection.send_amount
        }];

        while(1) {
          
          selection = await inquirer.prompt([
            {
              type: 'list',
              message: 'Do you want to add more addresses?',
              name: 'choice',
              choices : ['yes','no']
            }
          ]);

          if(selection.choice == "yes")
          {
            selection = await inquirer.prompt([
              {
                type: 'input',
                message: 'Input the Reciepient Address',
                name: 'rec_addr'
              },
              {
                type: 'number',
                message: "Input the amount",
                name: 'send_amount'
              }
            ]);

            let tempCoinType = getCoinType(selection.rec_addr);

            if(coinType === tempCoinType){
              output_list.push({
                address : selection.rec_addr,
                value : selection.send_amount
              })
            }

            else{
              console.log("Please enter an addresses for the same coinType as above.\n");
            }
          }
          else{
            break;
          }

        }


        await sendTransaction(wallet_id, output_list, coinType);
        break;

      case 'Recieve Transaction':

        let added_coins1 : any = await getCoinsFromWallet(wallet_id);
        // console.log(added_coins);
        let all_coins1 : any = [
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

        for (let i in all_coins1) {
          if (added_coins1.indexOf(all_coins1[i].value) == -1) {
            delete(all_coins1[i]);
            // console.log("Ping")
          }
        }

        // console.log(all_coins1.filter(Boolean));
        selection = await inquirer.prompt([
          {
            type: 'list',
            message: 'Select Coin type',
            name: 'coinType',
            choices: all_coins1.filter(Boolean)
          }
        ]);
        
        await recieveTransaction(wallet_id, selection.coinType);
        break;

      default:
        break;
    }
  } else if (selection.choice === 'Card Authentication') {
    await cardAuth();
  }
})().catch((err) => console.log(err));

let ec = new elliptic.ec('p256');

const publicKey =
  'EA41042CC5A216AC66B41F6549FF0313F592825871AB493911A2ACBDA545B212CDC028065061BB4A01F692C04EAC80D40E832483D54DBEDC1C6A91B6653DC7F81C13B51A20362B44AB46F05574D60521E7F8BFF0996CBF2F97654C6B171FD0D4EA711FF46E9000';

const signature =
  '9aeb92a58c8844c408e79b1eced7589c2c5739db6b67522d72a903c60591b681a14976cc4498f9f2e56932b7bb9334f2292b2ff4baa325cfa040343107dd4381aaaaaaa101';

const curveLength = Math.ceil(256 / 8);

let pubX = publicKey.slice(0, publicKey.length / 2);
let pubY = publicKey.slice(publicKey.length / 2);
let publicKeyObject = ec.keyFromPublic({ x: pubX, y: pubY }, 'hex');
let r = signature.slice(0, curveLength * 2);
let s = signature.slice(curveLength * 2);
let validSig = ec.verify('EA21278116A5', { r: r, s: s }, publicKeyObject);
console.log(validSig);
