import dotenv from 'dotenv-flow';
dotenv.config();

import path from 'path';
import process from 'process';
import fs from 'fs';
import receiveTransaction from './handler/receiveTransaction';
import sendTransaction from './handler/sendTransaction';
import addCoin from './handler/addCoin';
import customAction from './handler/customActions';
import allWalletsList from './handler/walletsList';
import addWallet from './handler/addWallet';
import cardAuth from './handler/cardAuth';
import addAllWallets from './handler/addAllWallets';
import addBootloader from './handler/addBootloader';
import enableSwd from './handler/enableSwd';
import disableSwd from './handler/disableSwd';
import stmCli from './stm';
import { queryList } from './helper/cliInput';
import { deviceAuthandUpgrade, onlyUpgrade } from '../flows/authAndUpgrade';
import fetchLogs from './handler/fetchLogs';
import isExecutable from '../utils/isExecutable';

// @ts-ignore
import * as logs from 'simple-node-logger';

const log = logs.createSimpleFileLogger('project.log');

const cliTool = async () => {
  const allArgs = process.argv;
  console.log({ allArgs });

  let args: string[] = [];

  if (allArgs.length > 2) {
    args = allArgs.slice(2);
  }

  let selection = '';
  if (args.length > 0) {
    selection = args[0];
  } else {
    selection = await queryList([
      'STM CLI',
      'Add Bootloader',
      'Card Authentication',
      'Custom from JSON',
      'Upgrade',
      'Only Upgrade',
      'Fetch Logs',
      'Disable SWD',
      'Enable SWD',
    ]);
  }

  switch (selection) {
    case 'Add Bootloader':
      await addBootloader();
      break;

    case 'Card Authentication':
      await cardAuth();
      break;

    case 'Upgrade':
      await deviceAuthandUpgrade();
      break;

    case 'Only Upgrade':
      await onlyUpgrade();
      break;

    case 'Enable SWD':
      await enableSwd();
      break;

    case 'Disable SWD':
      await disableSwd();
      break;

    case 'Fetch Logs':
      await fetchLogs();
      break;

    case 'Custom from JSON':
      let customData: any;
      try {
        let fileData: Buffer;
        if (isExecutable()) {
          fileData = fs.readFileSync(path.join(process.cwd(), 'custom.json'));
        } else {
          fileData = fs.readFileSync(
            path.join(__dirname, '../', '../', 'custom.json')
          );
        }

        customData = JSON.parse(fileData.toString('utf-8'));
      } catch (error) {
        console.error('Error in reading `custom.json` file');
        console.error(error);
      }
      await customAction(customData);
      break;
    case 'STM CLI':
      await stmCli();
      break;
    default:
      console.log('Invalid selection');
      process.exit(1);
  }
};

(async () => {
  cliTool().catch();
})();
