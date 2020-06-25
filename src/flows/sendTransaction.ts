//ToDo, create a universal coinType object for refrence in whole system - done (kind of)
//ToDo, if user enters same address twice, instead of making two output fields, make 1 output field with added balance, or give the user an error.
import { createPort } from '../communication/port';
import { sendData } from '../communication/sendData';
import { coins as COINS } from '../config';
import { recieveData, recieveCommand } from '../communication/recieveData';
import { getXpubFromWallet, Wallet, pinSetWallet } from './wallet';
import { default as base58 } from 'bs58';
import { default as Datastore } from 'nedb';
import deviceReady from '../communication/deviceReady';
import { query_input, query_number, query_list } from './cli_input';

//Bitcoin (Mainnet) - 00
//Bitcoin (Testnet) - 6f
//Litecoin - 30
//Dash - 4c
//Doge - 1e

//Get Coin type from address
export const getCoinType = (address: string) => {
    let decodedString = base58.decode(address).toString('hex')
    let addressVersion = decodedString.slice(0, 2);

    if (addressVersion === '00')
        return COINS.BTC;
    if (addressVersion === '6f')
        return COINS.BTC_TESTNET;
    if (addressVersion === '30')
        return COINS.LTC;
    if (addressVersion === '4c')
        return COINS.DASH;
    if (addressVersion === '1e')
        return COINS.DOGE;
}

//ToDo
const broadcastTransaction = (transaction: any) => {
    return 1;
}




//Only for CLI
const makeOutputList = async () => {
    let rec_addr = await query_input('Input the Reciepient Address');

    let send_amount = await query_number('Input the amount');


    const coinType = getCoinType(rec_addr);

    const output_list = [
        {
            address: rec_addr,
            value: send_amount,
        },
    ];

    while (1) {
        let selection = await query_list(['yes', 'no'], 'Do you want to add more addresses?')


        if (selection == 'yes') {
            rec_addr = await query_input('Input the Reciepient Address');

            send_amount = await query_number('Input the amount');

            let tempCoinType = getCoinType(rec_addr);

            if (coinType === tempCoinType) {
                output_list.push({
                    address: rec_addr,
                    value: send_amount,
                });
            }
            else {
                console.log(
                    'Please enter an addresses for the same coinType as above.\n'
                );
            }
        }
        else {
            break;
        }
    }

    return { output_list, coinType };
}






//Output list is 
//let output = [
// {
//     "address":output_address,
//     "value":amount
// }];
//Yet to complete this function.
export const sendTransaction = async (wallet_id: any, output_list: any, coinType: any, fee_rate: any) => {
    //will get xPub from wallet_id and the coin_type

    const { connection, serial } = await createPort();
    connection.open();

    if (process.env.NODE_ENV!.trim() == 'cli') {
        let t = await makeOutputList();
        output_list = t.output_list;
        coinType = t.coinType;

        fee_rate = await query_list([
            { name: "Low", value: "l" },
            { name: "Medium", value: "m" },
            { name: "High", value: "h" },
        ], "Select the transaction fees");
    }

    const ready = await deviceReady(connection);


    if (ready) {
        let xpub = await getXpubFromWallet(wallet_id, coinType);

        let wallet = new Wallet(xpub, coinType);
        let txn_metadata = await wallet.generateMetaData(output_list);

        console.log("Destop : Sending Wallet ID and Txn Metadata.");
        console.log("Wallet id: " + wallet_id);
        console.log("Transaction Metadata" + txn_metadata);
        await sendData(connection, 50, wallet_id + txn_metadata);

        const coinConfirmed: any = await recieveCommand(connection, 51);
        if (!!parseInt(coinConfirmed)) {
            console.log('From Device: User confirmed coin.');
        } else {
            console.log('From Device: User did not confirm coin.\nExiting Function...');
            return 0;
        }



        let unsigned_txn: any = await wallet.generate_unsigned_transaction(output_list, 'm');

        console.log("Destop : Sending Unsigned Transaction.");
        console.log("Unsigned Transaction" + unsigned_txn);
        await sendData(connection, 52, unsigned_txn);

        const reciepentVerified = await recieveCommand(connection, 53);
        console.log("From Device (User verified reciepient amount and address) : ")
        console.log(reciepentVerified);

        // if (await pinSetWallet(wallet_id)) {
        //     const pinEnteredPin = await recieveCommand(connection, 47);
        //     console.log('From Device: User entered pin: ')
        //     console.log(pinEnteredPin);
        // }

        const cardsTapped = await recieveCommand(connection, 48);
        console.log("From Device (Cards are tapped) : ")
        console.log(cardsTapped);

        const signedTransaction = await recieveCommand(connection, 54);
        console.log("From Device (Signed Transaction) : ")
        console.log(signedTransaction);

        let s = broadcastTransaction(signedTransaction);

        if (s !== undefined) {
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