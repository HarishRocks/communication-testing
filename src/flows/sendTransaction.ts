//ToDo import list wallets
//Find out coin from recieve address
//ToDo, create a universal coinType object for refrence in whole system

import { createPort } from '../communication/port';
import { xmodemDecode , xmodemEncode } from '../xmodem';
import { ackData , sendData } from '../communication/sendData';
import { commands } from '../config';
import { hexToAscii } from '../bytes';
const coinSelect = require('coinselect');

const Wallet = require('wallet');
const base58 = require('bs58');
const bip32 = require('bip32');
const bitcoin = require('bitcoinjs-lib');
const axios = require('axios');
var crypto = require('crypto');

//Bitcoin (Mainnet) - 00
//Bitcoin (Testnet) - 6f
//Litecoin - 30
//Dash - 4c
//Doge - 1e

//Get Coin type from address
const getCoinType = (address: String) => {
    let decodedString = base58.decode(address).toString('hex')
    let coinType = decodedString.slice(0,2);

    if( coinType === '00')
        return "BTCM";
    if( coinType === '6f')
        return "BTCT";
    if( coinType === '30')
        return "LTC";
    if( coinType === '4c')
        return "DASH";
    if( coinType === '1e')
        return "DOGE";
}

const fetch_utxo = async (recieve:any, change:any) => {
    let utxos = []

    let res = await axios.get("http://api.blockcypher.com/v1/btc/test3/addrs/"+recieve+"?token=5849c99db61a468db0ab443bab0a9a22&unspentOnly=true");


    res = res["data"]["txrefs"]

    for(let i in res){
        // addresses.push(res["data"]["txrefs"][i]["address"]);

        let utxo = {
            "address": res[i].address,
            "txId": res[i].tx_hash,
            "vout": res[i].tx_output_n,
            "value": res[i].value,
            "block_height": res[i].block_height,
            "vin": res[i].tx_input_n,
            "ref_balance": res[i].ref_balance,
            "confirmations": res[i].confirmations
        }

        utxos.push(utxo);
    }

    res = await axios.get("http://api.blockcypher.com/v1/btc/test3/addrs/"+change+"?token=5849c99db61a468db0ab443bab0a9a22&unspentOnly=true");

    res = res["data"]["txrefs"]

    for(let i in res){
        // addresses.push(res["data"]["txrefs"][i]["address"]);

        let utxo = {
            "address": res[i].address,
            "txId": res[i].tx_hash,
            "vout": res[i].tx_output_n,
            "value": res[i].value,
            "block_height": res[i].block_height,
            "vin": res[i].tx_input_n,
            "ref_balance": res[i].ref_balance,
            "confirmations": res[i].confirmations
        }

        utxos.push(utxo);
    }
    // console.log(utxos);
    return utxos;
}


//Output list is 
//let output = [
// {
//     "address":output_address,
//     "value":amount
// }];
const generateMetaData = (coinType : String, xPub : String, outputList : any, recieve:any, change:any) => {
    let purposeIndex = "8000002c";
    let coinIndex;

    if( coinType === '00')
        coinIndex = "80000000";
    if( coinType === '6f')
        coinIndex = "80000001";
    if( coinType === '30')
        coinIndex = "80000002";
    if( coinType === '4c')
        coinIndex = "80000005";
    if( coinType === '1e')
        coinIndex = "80000003";

    let accountIndex = "80000000";

    //Put this in another function//
    let utxos = fetch_utxo(recieve, change);

    let feeRate = 50 //Yet to fetch this from an API



    let { inputs, outputs, fee } = coinSelect(utxos, outputList, feeRate)
    
    console.log(fee)
    
    if (!inputs || !outputs)
        return null; //insuffient funds
    //till here//

    
}

const __get_address_list = function (coin_type: any, xpub: any, start: any, end: any, chain: any) {
    let address_list = [];
    let node = null;
    let network = null;
    switch (coin_type) {
      case "btc":
        network = bitcoin.networks.testnet
        break;
      case "ltc":
        network = bitcoin.networks.litecoin
        break;
      case "dash":
        network = bitcoin.networks.dash
        break;
      case "doge":
        network = bitcoin.networks.dogecoin
        break;
  
  
    }
    if (network == null) {
      console.log("No Network")
      return null
    }
    node = bip32.fromBase58(xpub, network)
    for (let i = start; i < end; i++) {
      let { address } = bitcoin.payments.p2pkh({ pubkey: node.derivePath(`${chain}/${i}`).publicKey, network: network });
      address_list.push(address)
    }
    return address_list
  };


const get_change_address = async (xPub : any, coinType: any, change : String) => {
    let change_addresses = await axios.get("https://api.blockcypher.com/v1/btc/test3/addrs/"+change+"?token=5849c99db61a468db0ab443bab0a9a22");
    change_addresses = change_addresses["data"];

    let original_length = change_addresses["wallet"]["addresses"].length;


    let change_add = undefined;
    for(let i in change_addresses["txrefs"]){
        if(change_addresses["wallet"]["addresses"].includes(change_addresses["txrefs"][i]["address"]))
        {
            change_addresses["wallet"]["addresses"].splice(i,1);
            break;
        }
    }

    if(change_addresses["wallet"]["addresses"].length == 0){
        change_add = __get_address_list(coinType, xPub, 1, original_length, original_length+1); //use the 0th index. __get_address_list(coinType, xPub, 1, original_length, original_length+1)[0], not done now because of a typescript error
    }
    else{
        change_add = change_addresses["wallet"]["addresses"][0];
    }

    return change_add;
}



const generate_unsigned_transaction = async (xpub : any, output_address : any, amount : any, network : any, coinType : any) => {

    let change_add = await get_change_address(xpub , coinType , change);

    let targets = [
    {
        "address":output_address,
        "value":amount
    }];

    let utxos = await fetch_utxo("external","change");
    let {inputs, outputs, fee}  = coinSelect(utxos, targets, 10);


    for(let i in outputs){
        if(!("address" in outputs[i])){
            outputs[i]["address"] = change_add;
        }
    }

    for(let i in inputs){
        inputs[i]["scriptPubKey"] = bitcoin.address.toOutputScript(inputs[i]["address"],this.network);
    }

    let txBuilder = new bitcoin.TransactionBuilder(network);

    for(let i in inputs){
        let input = inputs[i];
        var scriptPubKey = input["scriptPubKey"];
        txBuilder.addInput(input.txId, input.vout, 0xffffffff, Buffer.from(scriptPubKey, 'hex'));
    }


    for(let i = 0; i < outputs.length; i++){
        let output = outputs[i];
        console.log(output);
        txBuilder.addOutput(output.address, output.value);
    }


    let tx = txBuilder.buildIncomplete()


    for(let i in inputs){
        let input = inputs[i];

        tx.ins[i].script = Buffer.from(input.scriptPubKey, 'hex');
    }

    console.log(tx.toHex());
    return tx.toHex();

}


const broadcastTransaction = () => {
    
}