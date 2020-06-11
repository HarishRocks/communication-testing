import { addWallet} from './flows/addWallet';
const inquirer = require('inquirer');

(async () => {

  while(1){
    const choice1 = await inquirer.prompt([
       {
         type: 'list',
         name: 'addOrSelectWallet',
         message: 'Select your option',
         choices: ['Select Wallet', 'Add Wallet'],
       },
    ]);

    if (choice1.addOrSelectWallet === "Add Wallet")
      await addWallet();
  }

    

    

})().catch( err => console.log(err));
