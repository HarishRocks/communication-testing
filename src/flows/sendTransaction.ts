//ToDo, create a universal coinType object for refrence in whole system - done (kind of)
//ToDo, if user enters same address twice, instead of making two output fields, make 1 output field with added balance, or give the user an error.
import { createPort } from '../communication/port';
import { ackData , sendData } from '../communication/sendData';
import { coins as COINS } from '../config';
import { recieveData, recieveCommand } from '../communication/recieveData';
import { getXpubFromWallet , Wallet } from './wallet';
import { default as base58 } from 'bs58';
import {default as Datastore } from 'nedb';
import deviceReady from '../communication/deviceReady';

//Bitcoin (Mainnet) - 00
//Bitcoin (Testnet) - 6f
//Litecoin - 30
//Dash - 4c
//Doge - 1e

//Get Coin type from address
export const getCoinType = (address: string) => {
    let decodedString = base58.decode(address).toString('hex')
    let addressVersion = decodedString.slice(0,2);

    if( addressVersion === '00')
        return COINS.BTC;
    if( addressVersion === '6f')
        return COINS.BTC_TESTNET;
    if( addressVersion === '30')
        return COINS.LTC;
    if( addressVersion === '4c')
        return COINS.DASH;
    if( addressVersion === '1e')
        return COINS.DOGE;
}

//ToDo
const broadcastTransaction = (transaction : any) => {
    return 1;
}

//Output list is 
	//let output = [
	// {
	//     "address":output_address,
	//     "value":amount
	// }];
	//Yet to complete this function.
export const sendTransaction = async ( wallet_id : any , output_list : any, coinType : any) => {
    //will get xPub from wallet_id and the coin_type
    
    const { connection, serial } = await createPort();
    connection.open();

    const ready = await deviceReady(connection);


    if(ready)
    {
        let xpub = await getXpubFromWallet(wallet_id,coinType);

        let wallet = new Wallet(xpub, coinType);
        let txn_metadata = await wallet.generateMetaData(output_list);

        console.log("Destop : Sending Wallet ID and Txn Metadata.");
        console.log("Wallet id: "+ wallet_id);
        console.log("Transaction Metadata" + txn_metadata);
        await sendData(connection, 50, wallet_id + txn_metadata);

        const coinConfirmed = await recieveCommand(connection,51);
        console.log("From Device (Coin Confirmed) : ")
        console.log(coinConfirmed);

        let unsigned_txn = await wallet.generate_unsigned_transaction(output_list);

        console.log("Destop : Sending Unsigned Transaction.");
        console.log("Unsigned Transaction" + unsigned_txn);
        await sendData(connection, 52, unsigned_txn);

        const reciepentVerified = await recieveCommand(connection,53);
        console.log("From Device (User verified reciepient amount and address) : ")
        console.log(reciepentVerified);

        // const pinEntered = await recieveCommand(connection,47);
        // console.log("From Device (user entered pin) : ")
        // console.log(pinEntered);

        const cardsTapped = await recieveCommand(connection,48);
        console.log("From Device (Cards are tapped) : ")
        console.log(cardsTapped);

        const signedTransaction = await recieveCommand(connection,54);
        console.log("From Device (Signed Transaction) : ")
        console.log(signedTransaction);

        let s = broadcastTransaction(signedTransaction);

        if(s !== undefined){
            await sendData(connection, 42, "01");
        }
        else {
            console.log("Boradcast Unsuccessful");
        }
    }
    else { 
        console.log("Device not ready");
    }
}