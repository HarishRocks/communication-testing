// ToDo ask suraj sir about the added_coins in recievetransaction flow
import { addWallet } from './flows/addWallet';
import { addCoin, allWalletsList, coinsNotAdded } from './flows/addCoin';
import cardAuth from './flows/cardAuth';
import { sendTransaction } from './flows/sendTransaction';
import { recieveTransaction } from './flows/recieveTransaction';
import { query_list } from './flows/cli_input';
import customAction from './flows/custom';
import { provision } from './flows/provision';
import { deviceAuthandUpgrade } from './flows/authAndUpgrade';
// import { sendData }
// const log = import('simple-node-logger').createSimpleFileLogger('project.log');
// @ts-ignore
import * as logs from 'simple-node-logger';
import { recieveCommand, recieveData } from './communication/recieveData';
import { sendData } from './communication/sendData';
const log = logs.createSimpleFileLogger('project.log');

const cli_tool = async () => {
  let selection = await query_list([
    'Select Wallet',
    'Add Wallet',
    'Card Authentication',
    'Custom',
  ]);

  switch (selection) {
    case 'Add Wallet':
      log.info('Add Wallet selected');
      await addWallet();
      log.info('Add wallet completed');
      break;
    case 'Card Authentication':
      await cardAuth();
      break;
    case 'Select Wallet':
      log.info('Selecting Wallet');
      const wallet_id = await query_list(
        await allWalletsList(),
        'Select your wallet'
      );
      log.info('Selected Wallet ID: ' + wallet_id);

      selection = await query_list([
        'Add Coin',
        'Send Transaction',
        'Recieve Transaction',
      ]);

      switch (selection) {
        case 'Add Coin':
          log.info('Add coin initiated');
          await addCoin(wallet_id, undefined);
          log.info('Add coin finished');
          break;
        case 'Send Transaction':
          log.info('Send transaction initiated');
          await sendTransaction(wallet_id, undefined, undefined, undefined);
          log.info('Send transaction finished');
          break;

        case 'Recieve Transaction':
          log.info('Recieve transaction initiated');
          await recieveTransaction(wallet_id, undefined);
          log.info('Recieve transaction finished');

          break;
      }
      break;
    case 'Custom':
      const actions = [
        {
          type: 'SEND',
          command: 70,
          data: '00',
        },
        {
          type: 'RECEIVE',
          command: 13,
        },
        {
          type: 'SEND',
          command: 16,
          data: '12345678',
        },
        {
          type: 'RECEIVE',
          command: 17,
        },
      ];
      await customAction(actions);
      break;
  }
};

// provision();
// deviceAuthandUpgrade();

export default cli_tool;
