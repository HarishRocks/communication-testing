//Find out coin from recieve address - done
//ToDo, create a universal coinType object for refrence in whole system - done (kind of)
//ToDo, think of another file for display_all_wallets function.

import { createPort } from '../communication/port';
import { ackData , sendData } from '../communication/sendData';
import { coins as COINS } from '../config';
import { recieveData, recieveCommand } from '../communication/recieveData';
import { Wallet } from './wallet';
import { default as base58 } from 'bs58';
import {default as Datastore } from 'nedb';
import deviceReady from '../communication/deviceReady';



export const recieveTransaction = async ( wallet_id : any , coinType : any) => {
    //will get xPub from wallet_id and the coin_type
    
    const { connection, serial } = await createPort();
    connection.open();

    const ready = await deviceReady(connection);


    if(ready)
    {

        wallet_id = "af19feeb93dfb733c5cc2e78114bf9b53cc22f3c64a9e6719ea0fa6d4ee2fe31";
        coinType = COINS.BTC_TESTNET;
        const wallet = new Wallet(wallet_id, coinType);

        let derivation_path = wallet.create_derivation_path();

        console.log("Destop : Sending Wallet ID and Derivation Path.");
        console.log("Wallet id: "+ wallet_id);
        console.log("Derivation Path" + derivation_path);
        await sendData(connection, 59, wallet_id + derivation_path);


        const coinsConfirmed = await recieveCommand(connection,60);
        console.log("From Device (User verified coin) : ")
        console.log(coinsConfirmed);

        const enteredPin = await recieveCommand(connection,61);
        console.log("From Device (user entered pin) : ")
        console.log(enteredPin);

        const cardsTapped = await recieveCommand(connection,62);
        console.log("From Device (Cards are tapped) : ")
        console.log(cardsTapped);

        const addressesVerified = await recieveCommand(connection,63);
        console.log("From Device (Verified recieve address) : ")
        console.log(addressesVerified);

        console.log(`\n\nDesktop : Sending Success Command.`);
        await sendData(connection, 42, "01");
    }
    else { 
        console.log("Device not ready");
    }
}