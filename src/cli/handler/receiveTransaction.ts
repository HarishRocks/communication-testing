import {allAvailableCoins, receiveTransaction} from '../../flows/receiveTransaction'
import {query_list} from "../../flows/cli_input";

export default async (walletId: string) => {
    const coinsAvailable = await allAvailableCoins(walletId);
    const coinType = await query_list(coinsAvailable, 'Select Coin type');
    await receiveTransaction(walletId, coinType);
}