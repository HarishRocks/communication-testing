import BigNumber from 'bignumber.js';
import * as bitcoin from 'bitcoinjs-lib';

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

export const getKeysFromSeed = (seed: string, path: string) => {
  console.log({ path });
  const wallet = bitcoin.bip32
    .fromSeed(Buffer.from(seed, 'hex'))
    .derivePath(path);

  if (!wallet.privateKey) {
    throw new Error('Cannot derive private keys');
  }

  return {
    publicKey: wallet.publicKey.toString('hex'),
    privateKey: wallet.privateKey.toString('hex'),
    xpub: wallet.neutered().toBase58(),
  };
};
