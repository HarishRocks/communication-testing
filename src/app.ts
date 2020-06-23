//ToDo ask suraj sir about the added_coins in recievetransaction flow
import { addWallet } from './flows/addWallet';
import { addCoin, allWalletsList, coinsNotAdded } from './flows/addCoin';
import cardAuth from './flows/cardAuth';
import { sendTransaction } from './flows/sendTransaction';
import { recieveTransaction } from './flows/recieveTransaction';
import { query_list } from './flows/cli_input';

import { provision } from "./flows/provision";
import { deviceAuthandUpgrade } from "./flows/authAndUpgrade";


(async () => {
  let selection = await query_list([
    'Select Wallet',
    'Add Wallet',
    'Card Authentication',
  ]);

  switch (selection) {
    case 'Add Wallet':
      await addWallet();
      break;
    case 'Card Authentication':
      await cardAuth();
      break;
    case 'Select Wallet':
      
      let wallet_id = await query_list(await allWalletsList() , 'Select your wallet');

      selection = await query_list([
        'Add Coin',
        'Send Transaction',
        'Recieve Transaction'
      ]);

      switch(selection){
        case 'Add Coin':
          await addCoin(wallet_id, undefined);
          break;
        
        case 'Send Transaction':
          await sendTransaction(wallet_id , undefined , undefined, undefined);
          break;

        case 'Recieve Transaction':
          await recieveTransaction(wallet_id , undefined);
          break;
      }
      break;
  }
})().catch((err) => console.log(err));
// provision();
// deviceAuthandUpgrade();