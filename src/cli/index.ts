import receiveTransaction from './handler/receiveTransaction';
import sendTransaction from './handler/sendTransaction';
import addCoin from './handler/addCoin';
import customAction from './handler/customActions';
import allWalletsList from './handler/walletsList';
import addWallet from './handler/addWallet';
import cardAuth from './handler/cardAuth';
import addAllWallets from './handler/addAllWallets';
import { queryList } from './helper/cliInput';
import { deviceAuthandUpgrade } from '../flows/authAndUpgrade';
import fetchLogs from './handler/fetchLogs';

// @ts-ignore
import * as logs from 'simple-node-logger';

const log = logs.createSimpleFileLogger('project.log');

const cliTool = async () => {
  let selection = await queryList([
    'Select Wallet',
    'Add All Wallets',
    'Add Wallet',
    'Card Authentication',
    'Custom',
    'Upgrade',
    'Fetch Logs',
  ]);

  switch (selection) {
    case 'Add Wallet':
      log.info('Add Wallet selected');
      await addWallet();
      log.info('Add wallet completed');
      break;

    case 'Add All Wallets':
      log.info('Add Wallet selected');
      await addAllWallets();
      log.info('Add wallet completed');
      break;

    case 'Card Authentication':
      await cardAuth();
      break;

    case 'Upgrade':
      await deviceAuthandUpgrade();
      break;

    case 'Fetch Logs':
      await fetchLogs();
      break;

    case 'Select Wallet':
      log.info('Selecting Wallet');
      const walletId = await queryList(
        await allWalletsList(),
        'Select your wallet'
      );
      log.info('Selected Wallet ID: ' + walletId);

      selection = await queryList([
        'Add Coin',
        'Send Transaction',
        'Recieve Transaction',
      ]);

      switch (selection) {
        case 'Add Coin':
          log.info('Add coin initiated');
          await addCoin(walletId);
          log.info('Add coin finished');
          break;
        case 'Send Transaction':
          log.info('Send transaction initiated');
          await sendTransaction(walletId);
          log.info('Send transaction finished');
          break;

        case 'Recieve Transaction':
          log.info('Recieve transaction initiated');
          await receiveTransaction(walletId);
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
          command: 42,
          data: '05',
        }
      ];
      await customAction(actions);
      break;
  }
};

(async () => {
  cliTool().catch();
})();
