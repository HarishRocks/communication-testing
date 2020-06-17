import { addWallet, addWalletDeviceInitiated } from './flows/addWallet';
import cardAuth from './flows/cardAuth';
import { addCoin } from './flows/addCoin';
const inquirer = require('inquirer');

(async () => {
  while (1) {
    const selection = await inquirer.prompt([
      {
        type: 'list',
        name: 'choice',
        message: 'Select your option',
        choices: [
          'Select Wallet',
          'Add Wallet',
          'Add Coin',
          'Card Authentication',
        ],
      },
    ]);

    switch (selection.choice) {
      case 'Add Wallet':
        await addWallet();
        break;
      case 'Add Coin':
        await addCoin(1, 1);
        break;
      case 'Card Authentication':
        cardAuth();
        break;
    }
  }
})().catch((err) => console.log(err));
