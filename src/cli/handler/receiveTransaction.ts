import {
  allAvailableCoins,
  receiveTransaction,
} from '../../flows/receiveTransaction';
import { queryList } from '../helper/cliInput';

export default async (walletId: string) => {
  const coinsAvailable = await allAvailableCoins(walletId);
  const coinType = await queryList(coinsAvailable, 'Select Coin type');
  await receiveTransaction(walletId, coinType);
};
