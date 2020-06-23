import { createPort } from '../communication/port';
import { ackData, sendData } from '../communication/sendData';
import { coins as COINS } from '../config';
import { recieveData, recieveCommand } from '../communication/recieveData';
import { Wallet, getXpubFromWallet, getCoinsFromWallet, pinSetWallet } from './wallet';
import { default as base58 } from 'bs58';
import { default as Datastore } from 'nedb';
import deviceReady from '../communication/deviceReady';
import { query_list } from './cli_input';


export const allAvailableCoins = async (wallet_id: any) => {
    let added_coins: any = await getCoinsFromWallet(wallet_id);
    // console.log(added_coins);
    let all_coins: any = [
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

    for (let i in all_coins) {
        if (added_coins.indexOf(all_coins[i].value) == -1) {
            delete all_coins[i];
            // console.log("Ping")
        }
    }

    // console.log(all_coins.filter(Boolean));

    return all_coins.filter(Boolean);
}


export const recieveTransaction = async (wallet_id: any, coinType: any) => {
    //will get xPub from wallet_id and the coin_type

    const { connection, serial } = await createPort();
    connection.open();

    if (process.env.NODE_ENV == 'cli ') {
        let coins_available = await allAvailableCoins(wallet_id);
        coinType = await query_list(coins_available, 'Select Coin type');

    }


    const ready = await deviceReady(connection);


    if (ready) {

        // wallet_id = "af19feeb93dfb733c5cc2e78114bf9b53cc22f3c64a9e6719ea0fa6d4ee2fe31";
        // coinType = COINS.BTC_TESTNET;
        let xpub = await getXpubFromWallet(wallet_id, coinType);

        const wallet = new Wallet(xpub, coinType);
        // console.log("Total Amount in your wallet")
        // console.log(await wallet.get_total_balance()); 
        let derivation_path = await wallet.create_derivation_path();
        let recieve_address = await wallet.get_recieve_address();

        console.log("Destop : Sending Wallet ID and Derivation Path.");
        console.log("Wallet id: " + wallet_id);
        console.log("Derivation Path" + derivation_path);
        await sendData(connection, 59, wallet_id + derivation_path);


        const coinsConfirmed = await recieveCommand(connection, 60);
        console.log("From Device (User verified coin) : ")
        console.log(coinsConfirmed);

        // if (await pinSetWallet(wallet_id)) {
        //     const pinEnteredPin = await recieveCommand(connection, 47);
        //     console.log('From Device: User entered pin: ')
        //     console.log(pinEnteredPin);
        // }

        const cardsTapped = await recieveCommand(connection, 62);
        console.log("From Device (Cards are tapped) : ")
        console.log(cardsTapped);

        console.log("Please verify if this is the same address on the device? \n" + recieve_address);
        const addressesVerified = await recieveCommand(connection, 63);
        console.log("From Device (Verified recieve address) : ")
        console.log(addressesVerified);

        console.log(`\n\nDesktop : Sending Success Command.`);
        await sendData(connection, 42, "01");
    }
    else {
        console.log("Device not ready");
    }
}