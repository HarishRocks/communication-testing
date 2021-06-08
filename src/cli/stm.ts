import stmUpdate from './handler/stmUpdate';
import {
  generateKeys,
  addHeader,
  signHeader,
  decodeHeader,
} from './handler/pythonCli';
import { queryList } from './helper/cliInput';

const cliTool = async () => {
  const selection = await queryList([
    'STM Update',
    'Generate Keys',
    'Add Header',
    'Sign Header',
    'Decode Header',
  ]);

  switch (selection) {
    case 'STM Update':
      await stmUpdate();
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
  }
};

export default cliTool;
