import {addCoin, coinsNotAdded} from "../../flows/addCoin";
import {queryCheckbox} from "../helper/cliInput";

export default async (walletID:string) => {
    const availableCoins = await coinsNotAdded(walletID);
    const coinTypes = await queryCheckbox(availableCoins, 'Choose your coins');
    if(!coinTypes || coinTypes.length < 1) {
        console.error("Select at least one coin")
        return;
    }
    await addCoin(walletID,coinTypes)
}