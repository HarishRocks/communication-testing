import dotenv from 'dotenv-flow';
dotenv.config();

import process from 'process';
import fs from 'fs';
import customAction from './handler/customActions';
import cardAuth from './handler/cardAuth';
import addBootloader from './handler/addBootloader';
import enableSwd from './handler/enableSwd';
import disableSwd from './handler/disableSwd';
import stmCli from './stm';
import { queryList, queryInput } from './helper/cliInput';
import { deviceAuthandUpgrade, onlyUpgrade } from '../flows/authAndUpgrade';
import commTest from '../flows/commTest';
import fetchLogs from './handler/fetchLogs';
import isExecutable from '../utils/isExecutable';

const cliTool = async () => {
  const allArgs = process.argv;

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
      'Communication Test',
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

    case 'Communication Test':
      await commTest();
      break;

    case 'Custom from JSON':
      let customData: any;
      const DEFAULT_INPUT = 'custom.json';

      const filename = await queryInput(`Enter the custom JSON filename`, {
        default: DEFAULT_INPUT,
      });

      try {
        let fileData = fs.readFileSync(filename);
        customData = JSON.parse(fileData.toString('utf-8'));
      } catch (error) {
        console.error('Error in reading `custom.json` file');
        console.error(error);
        process.exit(1);
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
