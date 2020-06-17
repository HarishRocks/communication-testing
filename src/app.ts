import { addWallet ,addWalletDeviceInitiated } from './flows/addWallet';
import { addCoin } from './flows/addCoin';
const inquirer = require('inquirer');

(async () => {

  while(1){
    const choice1 = await inquirer.prompt([
       {
         type: 'list',
         name: 'addOrSelectWallet',
         message: 'Select your option',
         choices: ['Select Wallet', 'Add Wallet', 'Add Coin'],
       },
    ]);

    if (choice1.addOrSelectWallet === "Add Wallet")
      await addWallet();
    if(choice1.addOrSelectWallet === "Add Coin")
        await addCoin(1,1);
}

    
await addWallet();

})().catch( err => console.log(err));
