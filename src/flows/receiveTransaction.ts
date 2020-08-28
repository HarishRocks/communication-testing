import { createPort } from '../core/port';
import { sendData } from '../core/sendData';
import { coins as COINS } from '../config';
import { receiveCommand } from '../core/recieveData';
import { Wallet, getXpubFromWallet, getCoinsFromWallet } from './wallet';
import deviceReady from '../core/deviceReady';
import { logger } from '../utils';

export const allAvailableCoins = async (walletId: any) => {
  const addedCoins: any = await getCoinsFromWallet(walletId);
  const allCoins: any = [
    {
      name: 'BITCOIN',
      value: COINS.BTC,
    },
    {
      name: 'BITCOIN TESTNET',
      value: COINS.BTC_TESTNET,
    },
    {
      name: 'LITECOIN',
      value: COINS.LTC,
    },
    {
      name: 'DOGECOIN',
      value: COINS.DOGE,
    },
    {
      name: 'DASHCOIN',
      value: COINS.DASH,
    },
  ];

  for (const i in allCoins) {
    if (addedCoins.indexOf(allCoins[i].value) === -1) {
      delete allCoins[i];
    }
  }

  return allCoins.filter(Boolean);
};

export const receiveTransaction = async (walletId: any, coinType: any) => {
  try {
    const { connection } = await createPort();
    connection.open();

    const ready = await deviceReady(connection);
    if (ready) {
      const xpub = await getXpubFromWallet(walletId, coinType);
      const wallet = new Wallet(xpub, coinType);
      const derivationPath = await wallet.create_derivation_path();
      const receiveAddress = await wallet.get_recieve_address();

      logger.info('Desktop : Sending Wallet ID and Derivation Path.');
      logger.info(`Wallet id: ${walletId}`);
      logger.info(`Derivation Path: ${derivationPath}`);

      await sendData(connection, 59, walletId + derivationPath);

      const coinsConfirmed = await receiveCommand(connection, 60);

      switch (coinsConfirmed) {
        case '01':
          logger.info('From Device (User verified coin)');
          break;
        case '00':
          logger.info('From Device (Devices Rejected)');
          connection.close();
          return 0;
        default:
          logger.info(
            `From Device (Unknown Value Received) : ${coinsConfirmed}`
          );
          connection.close();
          return 0;
      }

      logger.info(
        `Please verify if this is the same address on the device?\n${receiveAddress}`
      );

      const addressesVerified = await receiveCommand(connection, 63);

      logger.info(
        `From Device (Verified receive address) : ${addressesVerified}`
      );
      logger.info(`Desktop : Sending Success Command.`);

      await sendData(connection, 42, '01');
    } else {
      logger.alert('Device not ready');
    }
    connection.close();
  } catch (e) {
    logger.error('Error occurred ' + e);
    return 0;
  }
};
