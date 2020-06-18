import { createPort } from '../communication/port';
import { sendData } from '../communication/sendData';
import { recieveData, recieveCommand } from '../communication/recieveData';
import { hexToAscii } from '../bytes';
import { addWalletToDB } from './wallet';

const Datastore = require('nedb')



//Todo in this function, Replace all the commands with their const values. Example, 42 -> Status Command.
export const addWallet = async () => {

  const { connection, serial } = await createPort();
  connection.open();

  console.log(`Desktop : Sending Ready Command.\n\n`);
  await sendData(connection, 41, "00");

  //recieving Success Status Command (Value = 2)
  let d = await recieveCommand(connection, 42);
  console.log('From Device: ')
  console.log(d);

  //only proceed if device is ready, else quit.
  if (String(d).slice(0, 2) == "02") {
    console.log(`\n\nDesktop : Sending Add Wallet Command.\n\n`);
    await sendData(connection, 43, "00");


    // Example data to be recieved in hex 4142434400000000000000000000000000af19feeb93dfb733c5cc2e78114bf9b53cc22f3c64a9e6719ea0fa6d4ee2fe31
    console.log('Wallet Details From Device: ');
    d = await recieveCommand(connection, 44);
    console.log(d);

    addWalletToDB(d);

    console.log(`\n\nDesktop : Sending Success Command.`);
    await sendData(connection, 42, "01");
  }

  connection.close();
  connection.on('error', (d) => {
    console.log(d);
  });
}


//ONLY FOR TESTING PURPOSES RIGHT NOW
export const addWalletDeviceInitiated = async () => {

  const { connection, serial } = await createPort();
  connection.open();

  // this will work only one time and will self exit to prevent memory leak
  // initiate them whenever needed to get data otherwise just ignore it

  console.log('Wallet Details From Device: ');
  let d = await recieveCommand(connection, 44);
  console.log(d);


  console.log(`\n\nDesktop : Sending Success Command.`);
  await sendData(connection, 42, "01");

  connection.close();
  connection.on('error', (d) => {
    console.log(d);
  });
}