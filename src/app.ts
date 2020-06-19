import { addWallet, addWalletDeviceInitiated } from './flows/addWallet';
import { addCoin } from './flows/addCoin';
import cardAuth from './flows/cardAuth';
import { coins as COINS } from './config';
import {
  allAvailableWallets,
  Wallet,
  getCoinsFromWallet,
} from './flows/wallet';
const inquirer = require('inquirer');

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
    console.log(wallets);
    let display_wallets: any = [];

    //make a list for inquirer with name and ID.
    wallets.forEach((element: any) => {
      display_wallets.push({
        name: element.name,
        value: element._id,
      });
    });

    console.log(display_wallets);
    console.log(display_wallets[0].name);

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
        console.log('Wallet Id' + wallet_id);
        let added_coins: any = await getCoinsFromWallet(wallet_id);
        console.log('added coins' + added_coins);
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
          if (all_coins[i].value in added_coins) {
            all_coins[i].disabled = 'Already Added';
          }
        }

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
        break;

      case 'Recieve Transaction':
        break;

      default:
        break;
    }
  } else if (selection.choice === 'Card Authentication') {
    await cardAuth();
  }
})().catch((err) => console.log(err));
