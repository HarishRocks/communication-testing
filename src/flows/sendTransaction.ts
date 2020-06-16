//Find out coin from recieve address - done
//ToDo, create a universal coinType object for refrence in whole system - done (kind of)
//ToDo, think of another file for display_all_wallets function.

import { createPort } from '../communication/port';
import { xmodemDecode , xmodemEncode } from '../xmodem';
import { ackData , sendData } from '../communication/sendData';
import { commands } from '../config';
import { hexToAscii } from '../bytes';
import { coins as COINS } from '../config';

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
        return COINS.BTC;
    if( coinType === '6f')
        return COINS.BTC_TESTNET;
    if( coinType === '30')
        return COINS.LTC;
    if( coinType === '4c')
        return COINS.DASH;
    if( coinType === '1e')
        return COINS.DOGE;
}





const broadcastTransaction = () => {
    
}

export const sendTransaction = async ( wallet_id : any ) => {
    //will get xPub from wallet_id and the coin_type
}