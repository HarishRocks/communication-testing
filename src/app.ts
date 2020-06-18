import { addWallet, addWalletDeviceInitiated } from './flows/addWallet';
import { addCoin } from './flows/addCoin';
import cardAuth from './flows/cardAuth';
import { allAvailableWallets } from './flows/wallet';
const inquirer = require('inquirer');

(async () => {

    let selection = await inquirer.prompt([
        {
            type: 'list',
            name: 'choice',
            message: 'Select your option',
            choices: ['Select Wallet', 'Add Wallet','Card Authentication'],
        },
    ]);

    if (selection.choice === "Add Wallet") {
        await addWallet();
    }

    if (selection.choice === "Select Wallet") {
        let wallets: any;
        wallets = await allAvailableWallets()
        console.log(wallets);
        let display_wallets: any = [];
        wallets.forEach((element: any) => {
            display_wallets.push({
                //to remove all the null characters ( \u0000)
                name: element.name.replace('\0', '').replace(/\0/g, ''),
                value: element._id
            })
        });

        console.log(display_wallets);
        console.log(display_wallets[0].name);

        selection = await inquirer.prompt([
            {
                type: 'list',
                name: 'selectedWallet',
                message: 'Select your wallet',
                choices: display_wallets,
            }
        ]);

        const wallet_id = selection.selectedWallet;

        selection = await inquirer.prompt([
            {
                type : 'list',
                name : 'walletAction',
                message : 'Choose your action',
                choices : ['Add Coin', 'Send Transaction', 'Recieve Transaction']
            }
        ]);

        switch (selection.walletAction) {
            case "Add Coin":
                
                break;

            case "Send Transaction":
                
                break;

            case "Recieve Transaction":
            
                break;

            default:
                break;
        }

    }

    if(selection.choice === "Card Authentication")
    {
        await cardAuth();
    }


})().catch(err => console.log(err));