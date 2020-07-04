import { createPort } from '../communication/port';
import { sendData } from '../communication/sendData';
import { recieveData, recieveCommand } from '../communication/recieveData';
import { addWalletToDB, allAvailableWallets } from './wallet';
import deviceReady from '../communication/deviceReady';

/**
 * Adds the wallet recieved from the hardware to the local database.
 */

export const addWallet = async () => {
  const { connection, serial } = await createPort();
  connection.open();

  const ready = await deviceReady(connection);

  // only proceed if device is ready, else quit.
  if (ready) {
    console.log(`\n\nDesktop : Sending Add Wallet Command.\n\n`);
    await sendData(connection, 43, '00');

    // Example data to be recieved in hex 4142434400000000000000000000000000af19feeb93dfb733c5cc2e78114bf9b53cc22f3c64a9e6719ea0fa6d4ee2fe31
    const walletDetails = await recieveCommand(connection, 44);
    if(walletDetails === "00"){
      console.log("From Device (Rejected Request)\n");
      return 0;
    }
    console.log('Wallet Details From Device: ');
    console.log(walletDetails);

    addWalletToDB(walletDetails);

    console.log(`\n\nDesktop : Sending Success Command.`);
    await sendData(connection, 42, '01');
  }

  connection.close();
  connection.on('error', (d) => {
    console.log(d);
  });
};

// ONLY FOR TESTING PURPOSES RIGHT NOW
// Not Required Anymore
// export const addWalletDeviceInitiated = async () => {

//   const { connection, serial } = await createPort();
//   connection.open();

//   // this will work only one time and will self exit to prevent memory leak
//   // initiate them whenever needed to get data otherwise just ignore it

//   console.log('Wallet Details From Device: ');
//   let d = await recieveCommand(connection, 44);
//   console.log(d);

//   console.log(`\n\nDesktop : Sending Success Command.`);
//   await sendData(connection, 42, "01");

//   connection.close();
//   connection.on('error', (d) => {
//     console.log(d);
//   });
// }
