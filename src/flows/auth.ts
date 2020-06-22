import { createPort } from '../communication/port';
import { sendData } from '../communication/sendData';
import { coins as COINS } from '../config';
import { recieveData, recieveCommand } from '../communication/recieveData';
import { getXpubFromWallet, Wallet, pinSetWallet } from './wallet';
import { default as base58 } from 'bs58';
import { default as Datastore } from 'nedb';
import deviceReady from '../communication/deviceReady';
import { query_input, query_number, query_list } from './cli_input';
const axios = require('axios');


const nulldata = "00000000";
const cyBaseURL = 'http://3.6.66.118';

const getAccessToken = async (serialNumber: any, signature: any) => {
    let res: any = axios.post(`${cyBaseURL}/auth/login`, {
        serialNumber: serialNumber,
        signature: signature,
    });

    console.log('autheticated');
    let accessToken = res.data.token;
    axios.defaults.headers.common[
        'Authorization'
    ] = `Bearer ${accessToken}`;

    return accessToken;
}

const getRandomNumFromServer = async (serialNumber: any, firmwareVersion: any) => {
    let res: any = axios.post(`${cyBaseURL}/randomNumber`, {
        serialNumber: serialNumber,
        firmwareVersion: firmwareVersion,
    });

    let randomNumber = res.data;
    return randomNumber;
}

const verifySignedChallenge = async (serialNumber: any, signedChallenge: any, firmwareVersion: any) => {
    let res : any = axios.post(`${cyBaseURL}/verify`, {
        serialNumber: serialNumber,
        signature: signedChallenge,
        firmwareVersion: firmwareVersion,
    });

    if(res.data){
        return 1;
    } else { 
        return 0;
    }
}

export const deviceAuth = async () => {
    //will get xPub from wallet_id and the coin_type

    const { connection, serial } = await createPort();
    connection.open();

    // await sendData(connection , IN_BOOTLOADER_MODE, "00");

    // const bootloaderMode = recieveCommand(connection, BOOTLOADER_STATUS)
    const bootloaderMode = "01";
    if (!parseInt(bootloaderMode)) {
        console.log("Device not in bootloader mode.\nExiting function...");
        return 0;
    }

    // await sendData(connection, START_AUTH_FLOW, "00");

    // const authFlowStatus = recieveCommand(connection, BOOTLOADER_STATUS)
    const authFlowStatus = "01";
    if (!parseInt(authFlowStatus)) {
        console.log("Device denied Start Auth flow.\nExiting function...");
        // return 0;
    }

    await sendData(connection, 23, nulldata);

    const serialNumber = await recieveCommand(connection, 24);
    console.log("From Device: Serial number: " + serialNumber);

    await sendData(connection, 12, nulldata);

    const signature = await recieveCommand(connection, 13);

    const accessToken = await getAccessToken(serialNumber, signature);

    await sendData(connection, 14, nulldata);

    const firmwareVersion = await recieveCommand(connection, 15);
    console.log("From Device: Firmware Version: " + firmwareVersion);

    const randomNumber = await getRandomNumFromServer(serialNumber, firmwareVersion);

    await sendData(connection, 16, randomNumber);

    const signedChallenge = await recieveCommand(connection, 17);


}