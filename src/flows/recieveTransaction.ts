//Find out coin from recieve address - done
//ToDo, create a universal coinType object for refrence in whole system - done (kind of)
//ToDo, think of another file for display_all_wallets function.

import { createPort } from '../communication/port';
import { ackData , sendData } from '../communication/sendData';
import { coins as COINS } from '../config';
import { recieveData, recieveCommand } from '../communication/recieveData';
const Wallet = require('./wallet')
const base58 = require('bs58');
const Datastore = require('nedb')



const create_derivation_path = async (xpub : any, coinType : any){
    let wallet = Wallet(xpub , coinType);
    let recieve_address = wallet.get_recieve_address();

    let purposeIndex = "8000002c";
    let coinIndex;

    if( this.coinType === COINS.BTC) //x  
        coinIndex = "80000000";
    if( this.coinType === COINS.BTC_TESTNET )
        coinIndex = "80000001";
    if( this.coinType === COINS.LTC)
        coinIndex = "80000002";
    if( this.coinType === COINS.DASH)
        coinIndex = "80000005";
    if( this.coinType === COINS.DOGE)
        coinIndex = "80000003";

    let accountIndex = "80000000";

    let internal_external_index = "00000000";

    let address_index = wallet.get_chain_address_index(recieve_address);

    return purposeIndex + coinIndex + accountIndex + internal_external_index + address_index;

}

const get_xpub_from_wallet = (wallet_id : any, coinType : any){
    let db = new Datastore({ filename: 'db/wallet_db.db', autoload: true });

    let wallet_details : any;
    db.findOne({ _id: wallet_id }, function (err, doc) {
        wallet_details = doc;
    });
    let xpub : any;
    for( let i in wallet_details.xPubs )
    {
        if(wallet_details.xPubs[i].coinType === coinType)
        {
            xpub = wallet_details.xPubs[i].xPub;
        }
    }    
     return xpub; 
}



export const recieveTransaction = async ( wallet_id : any , coinType : any) => {
    //will get xPub from wallet_id and the coin_type
    
    const { connection, serial } = await createPort();
    connection.open();

    console.log(`Desktop : Sending Ready Command.\n\n`);
    await sendData(connection, 41, "00");
    
    //recieving Success Status Command (Value = 2)
    let d = await recieveCommand(connection, 42);
    console.log('From Device: ')
    console.log(d);

    if(String(d).slice(0,2) == "02")
    {
        wallet_id = "af19feeb93dfb733c5cc2e78114bf9b53cc22f3c64a9e6719ea0fa6d4ee2fe31";
        let xpub = get_xpub_from_wallet(wallet_id,coinType);

        let wallet = new Wallet(xpub, coinType);
        let txn_metadata = await wallet.generateMetaData(output_list);

        console.log("Destop : Sending Wallet ID and Txn Metadata.");
        console.log("Wallet id: "+ wallet_id);
        console.log("Transaction Metadata" + txn_metadata);
        await sendData(connection, 52, wallet_id + txn_metadata);

        d = await recieveCommand(connection,53);
        console.log("From Device : ")
        console.log(d);

        let unsigned_txn = await wallet.generate_unsigned_transaction(output_list);

        console.log("Destop : Sending Unsigned Transaction.");
        console.log("Unsigned Transaction" + unsigned_txn);
        await sendData(connection, 54, unsigned_txn);

        d = await recieveCommand(connection,55);
        console.log("From Device (User verified reciepient amount and address) : ")
        console.log(d);

        d = await recieveCommand(connection,56);
        console.log("From Device (user entered pin) : ")
        console.log(d);

        d = await recieveCommand(connection,57);
        console.log("From Device (Cards are tapped) : ")
        console.log(d);

        d = await recieveCommand(connection,58);
        console.log("From Device (Signed Transaction) : ")
        console.log(d);

        let s = broadcastTransaction(d);

        if(d){
            sendData(connection, 42, "01");
        }
    }
    else { 
        console.log("Device not ready");
    }
}