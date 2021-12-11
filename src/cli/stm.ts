import stmUpdate from './handler/stmUpdate';
import {
  generateKeys,
  addHeader,
  signHeader,
  decodeHeader,
} from './handler/pythonCli';
import { queryList, queryInput } from './helper/cliInput';

const cliTool = async () => {
  const allArgs = process.argv;

  let args: string[] = [];

  if (allArgs.length > 3) {
    args = allArgs.slice(3);
  }

  let selection = '';
  if (allArgs.length > 2) {
    if (args.length > 0) {
      selection = args[0];
    }
  } else {
    selection = await queryList([
      'STM Update',
      'Generate Keys',
      'Add Header',
      'Sign Header',
      'Decode Header',
    ]);
  }

  switch (selection) {
    case 'STM Update':
      const DEFAULT_INPUT = 'BlinkLed_Signed.bin';

      const input = await queryInput(`Enter the input binary filename`, {
        default: DEFAULT_INPUT,
      });

      await stmUpdate(input);
      break;
    case 'Generate Keys':
      await generateKeys();
      break;
    case 'Add Header':
      await addHeader();
      break;
    case 'Sign Header':
      await signHeader();
      break;
    case 'Decode Header':
      await decodeHeader();
      break;
    default:
      console.log('Invalid selection');
      process.exit(1);
  }
};

export default cliTool;
