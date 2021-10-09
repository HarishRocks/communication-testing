import path from 'path';
import process from 'process';
import { exec } from 'child_process';
import { promisify } from 'util';
import BigNumber from 'bignumber.js';

const asyncExec = promisify(exec);

export const calculatePathFromIndex = (index: string) => {
  const PER_INDEX_LIMIT = new BigNumber(2).pow(31);
  const num = new BigNumber(index);

  let firstIndex = -1;
  let secondIndex = -1;

  if (num.isGreaterThanOrEqualTo(PER_INDEX_LIMIT)) {
    firstIndex = num
      .dividedBy(PER_INDEX_LIMIT)
      .integerValue(BigNumber.ROUND_DOWN)
      .minus(1)
      .toNumber();

    secondIndex = num
      .modulo(PER_INDEX_LIMIT)
      .integerValue(BigNumber.ROUND_DOWN)
      .toNumber();
  } else {
    firstIndex = num.toNumber();
  }

  if (firstIndex >= PER_INDEX_LIMIT.toNumber()) {
    throw new Error(`First index: ${firstIndex} is invalid.`);
  }

  if (secondIndex >= PER_INDEX_LIMIT.toNumber()) {
    throw new Error(`Second index: ${secondIndex} is invalid.`);
  }

  if (secondIndex < 0) {
    return `${firstIndex}`;
  }

  return `${firstIndex}/${secondIndex}`;
};

const formatOutput = (data: string) => {
  const obj: { [key: string]: string } = {};

  for (const line of data.split('\n')) {
    const varArr = line.split('=');
    if (varArr.length >= 2) {
      const key = varArr[0].trim();
      const value = varArr.slice(1).join('').trim();
      obj[key] = value;
    }
  }

  return obj;
};

export const getKeysFromSeed = async (
  seed: string,
  derivationPath: string,
  curve: string
) => {
  console.log({ path: derivationPath });
  let command = 'deriveKeys';

  if (process.platform === 'win32') {
    command += '.exe';
  }

  const cliPath = path.join(__dirname, '../', '../', command);
  const { stderr, stdout } = await asyncExec(
    `${cliPath} ${seed} "${derivationPath}" ${curve}`
  );

  if (stderr) {
    throw new Error(`stderr: ${stderr}`);
  }

  const data = formatOutput(stdout);
  return {
    privateKey: data['Private Key'],
    publicKey: data['Public Key'],
    xpub: data['XPUB(bin)'],
  };
  //const wallet = bitcoin.bip32
  //.fromSeed(Buffer.from(seed, 'hex'))
  //.derivePath(path);

  //if (!wallet.privateKey) {
  //throw new Error('Cannot derive private keys');
  //}

  //return {
  //publicKey: wallet.publicKey.toString('hex'),
  //privateKey: wallet.privateKey.toString('hex'),
  //wif: wallet.toWIF(),
  //xpub: wallet.neutered().toBase58(),
  //};
};
