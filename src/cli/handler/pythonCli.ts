import process from 'process';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { queryNumber, queryInput } from '../helper/cliInput';
import isExecutable from '../../utils/isExecutable';
import { constants } from '../../config';
import { getKeysFromSeed, calculatePathFromIndex } from '../../utils/crypto';

const asyncExec = promisify(exec);

let cliCommand: string;
if (isExecutable()) {
  let command = 'index';

  if (process.platform === 'win32') {
    command = 'index.exe';
  }

  const cliPath = path.join(process.cwd(), 'python-cli', command);
  cliCommand = cliPath;
} else {
  let command = 'python';

  if (process.platform === 'linux') {
    command = 'python3';
  }

  const cliPath = path.join(
    __dirname,
    '../',
    '../',
    '../',
    'python-cli',
    'index.py'
  );
  cliCommand = `${command} ${cliPath}`;
}

export const generateKeys = async () => {
  try {
    if (!constants.SECRET_SEED) {
      throw new Error('Please define a SECRET_SEED in .env');
    }

    const index = await queryNumber(
      'Enter the index of key pair (defaults to `1`)',
      { default: 1 }
    );

    const keys = await getKeysFromSeed(
      constants.SECRET_SEED,
      `m/1000'/4'/1'/0/${index - 1}`,
      'nist256p1'
    );

    const { stderr, stdout } = await asyncExec(
      `${cliCommand} store-key --index=${index} --private-key=${keys.privateKey} --public-key=${keys.publicKey}`
    );

    if (stderr) {
      console.log(`stderr: ${stderr}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
  } catch (error) {
    if (error) {
      console.log(`Error occured`);
      console.log(error);
      return;
    }
  }
};

export const addHeader = async () => {
  try {
    const DEFAULT_INPUT = 'BlinkLed.bin';
    const DEFAULT_OUTPUT = 'BlinkLed_Header.bin';
    const DEFAULT_VERSION = 'BlinkLed-version.txt';
    const DEFAULT_PRIVATE_KEY = 'private_key1.h';

    const allArgs = process.argv;

    let args: string[] = [];

    if (allArgs.length > 4) {
      args = allArgs.slice(4);
    }

    let input = DEFAULT_INPUT;
    let output = DEFAULT_OUTPUT;
    let version = DEFAULT_VERSION;
    let privateKey = DEFAULT_PRIVATE_KEY;

    if (allArgs.length <= 2) {
      input = await queryInput(`Enter the input binary filename`, {
        default: DEFAULT_INPUT,
      });
      output = await queryInput(`Enter the output binary filename`, {
        default: DEFAULT_OUTPUT,
      });
      version = await queryInput(`Enter the version filename`, {
        default: DEFAULT_VERSION,
      });
      privateKey = await queryInput(`Enter the private key filename`, {
        default: DEFAULT_PRIVATE_KEY,
      });
    } else {
      if (args.length > 0) {
        input = args[0];
      }
      if (args.length > 1) {
        output = args[1];
      }
      if (args.length > 2) {
        version = args[2];
      }
      if (args.length > 3) {
        privateKey = args[3];
      }
    }

    const { stderr, stdout } = await asyncExec(
      `${cliCommand} add-header --input=${input} --output=${output} --version=${version} --private-key=${privateKey}`
    );
    if (stderr) {
      console.log(`stderr: ${stderr}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
  } catch (error) {
    if (error) {
      console.log(`Error occured`);
      console.log(error);
      return;
    }
  }
};

export const signHeader = async () => {
  try {
    const DEFAULT_INPUT = 'BlinkLed_Header.bin';
    const DEFAULT_OUTPUT = 'app_dfu_package.bin';
    const DEFAULT_PRIVATE_KEY = 'private_key2.h';

    const allArgs = process.argv;

    let args: string[] = [];

    if (allArgs.length > 4) {
      args = allArgs.slice(4);
    }

    let input = DEFAULT_INPUT;
    let output = DEFAULT_OUTPUT;
    let privateKey = DEFAULT_PRIVATE_KEY;

    if (allArgs.length <= 2) {
      input = await queryInput(`Enter the input binary filename`, {
        default: DEFAULT_INPUT,
      });
      output = await queryInput(`Enter the output binary filename`, {
        default: DEFAULT_OUTPUT,
      });
      privateKey = await queryInput(`Enter the private key filename`, {
        default: DEFAULT_PRIVATE_KEY,
      });
    } else {
      if (args.length > 0) {
        input = args[0];
      }
      if (args.length > 1) {
        output = args[1];
      }
      if (args.length > 2) {
        privateKey = args[2];
      }
    }

    const { stderr, stdout } = await asyncExec(
      `${cliCommand} sign-header --input=${input} --output=${output} --private-key=${privateKey}`
    );
    if (stderr) {
      console.log(`stderr: ${stderr}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
  } catch (error) {
    if (error) {
      console.log(`Error occured`);
      console.log(error);
      return;
    }
  }
};

export const decodeHeader = async () => {
  try {
    const DEFAULT_INPUT = 'app_dfu_package.bin';

    const input = await queryInput(`Enter the input binary filename`, {
      default: DEFAULT_INPUT,
    });

    const { stderr, stdout } = await asyncExec(
      `${cliCommand} decode-header --input=${input}`
    );
    if (stderr) {
      console.log(`stderr: ${stderr}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
  } catch (error) {
    if (error) {
      console.log(`Error occured`);
      console.log(error);
      return;
    }
  }
};
