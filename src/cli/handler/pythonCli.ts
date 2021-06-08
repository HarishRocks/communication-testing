import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { queryNumber, queryInput } from '../helper/cliInput';

const asyncExec = promisify(exec);

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

export const generateKeys = async () => {
  try {
    const index = await queryNumber(
      'Enter the index of key pair (defaults to `1`)',
      { default: 1 }
    );
    const { stderr, stdout } = await asyncExec(
      `${command} ${cliPath} gen-key --index=${index}`
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

    const input = await queryInput(`Enter the input binary filename`, {
      default: DEFAULT_INPUT,
    });
    const output = await queryInput(`Enter the output binary filename`, {
      default: DEFAULT_OUTPUT,
    });
    const version = await queryInput(`Enter the version filename`, {
      default: DEFAULT_VERSION,
    });
    const privateKey = await queryInput(`Enter the private key filename`, {
      default: DEFAULT_PRIVATE_KEY,
    });

    const { stderr, stdout } = await asyncExec(
      `${command} ${cliPath} add-header --input=${input} --output=${output} --version=${version} --private-key=${privateKey}`
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
    const DEFAULT_OUTPUT = 'BlinkLed_Signed.bin';
    const DEFAULT_PRIVATE_KEY = 'private_key2.h';

    const input = await queryInput(`Enter the input binary filename`, {
      default: DEFAULT_INPUT,
    });
    const output = await queryInput(`Enter the output binary filename`, {
      default: DEFAULT_OUTPUT,
    });
    const privateKey = await queryInput(`Enter the private key filename`, {
      default: DEFAULT_PRIVATE_KEY,
    });

    const { stderr, stdout } = await asyncExec(
      `${command} ${cliPath} sign-header --input=${input} --output=${output} --private-key=${privateKey}`
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
    const DEFAULT_INPUT = 'BlinkLed_Signed.bin';

    const input = await queryInput(`Enter the input binary filename`, {
      default: DEFAULT_INPUT,
    });

    const { stderr, stdout } = await asyncExec(
      `${command} ${cliPath} decode-header --input=${input}`
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
