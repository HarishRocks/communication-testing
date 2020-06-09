import { createPort } from './communication/port';
import { xmodemDecode , xmodemEncode } from './xmodem';
import { ackData , sendData } from './communication/sendData';
import { commands } from './config';
import { hexToAscii } from './bytes';



const { ACK_PACKET } = commands;

const ack_recieve = (connection: any) => {
  const resData: any = [];
  return new Promise((resolve, reject) => {
    connection.on('data', (packet: any) => {
      const data = xmodemDecode(packet);
      data.forEach((d) => {
        const { commandType, currentPacketNumber, totalPacket, dataChunk } = d;
          resData[currentPacketNumber - 1] = dataChunk;
          if (currentPacketNumber === totalPacket) {
            resolve({commandType, data : resData.join('')});
          }
      });
    });
  });
};

const deviceReady = (connection: any) => {
  const resData: any = [];
  return new Promise((resolve, reject) => {
    connection.on('data', (packet: any) => {
      const data = xmodemDecode(packet);
      data.forEach((d) => {
        const { commandType, currentPacketNumber, totalPacket, dataChunk } = d;
          resData[currentPacketNumber - 1] = dataChunk;
          const ackPacket = ackData(
            ACK_PACKET,
            `0x${currentPacketNumber.toString(16)}`
          );
          connection.write(Buffer.from(`aa${ackPacket}`, 'hex'));
          if (currentPacketNumber === totalPacket) {
            resolve({commandType, data : resData.join('')});
          }
      });
    });
  });
};


const getPort = async () => {


  const { connection, serial } = await createPort();
  connection.open();

  // this will work only one time and will self exit to prevent memory leak
  // initiate them whenever needed to get data otherwise just ignore it

  console.log(`Desktop : Sending Ready Command.`);
  let data_to_send = xmodemEncode("00", 41);

  connection.write(Buffer.from(`aa${data_to_send[0]}`, 'hex'), (err) => {
    if(err) console.log("Error writing :"+err);
      else console.log("Success");
  })
  console.log(`Packet Sent :  ${data_to_send}`);
  console.log();



  let d = await ack_recieve(connection);
  console.log('Ack From Device: ')
  console.log(d);

  d = await deviceReady(connection);
  console.log('From Device: ')
  console.log(d);



  console.log(`Desktop : Sending Add Wallet Command.`);
  data_to_send = xmodemEncode("00", 43); 

  connection.write(Buffer.from(`aa${data_to_send[0]}`, 'hex'), (err) => {
    if(err) console.log("Error writing :"+err);
      else console.log("Success");
  })
  console.log(`Packet Sent :  ${data_to_send[0]}`);
  console.log();


  d = await ack_recieve(connection);
  console.log('Ack From Device: ')
  console.log(d);

  d = await deviceReady(connection);
  console.log('From Device: ')
  console.log(d);


  console.log(`Desktop : Sending Success Command.`);

  const x = '00000001';

  data_to_send = xmodemEncode(x, 42); 
  
  connection.write(Buffer.from(`aa${data_to_send[0]}`, 'hex'), (err) => {
    if(err) console.log("Error writing :"+err);
      else console.log("Success");
  })
  console.log(`Packet Sent :  ${data_to_send[0]}`);
  console.log();

  setTimeout(() => {
    connection.write(Buffer.from(`aa${data_to_send[0]}`, 'hex'), (err) => {
      if(err) console.log("Error writing :"+err);
        else console.log("Success");
    })
    console.log(`Packet Sent :  ${data_to_send[0]}`);
    console.log();
  }, 5000);

  /**
   * Code below is just to create hardware output doc
   * Don't remove & don't use
   */

  // connection.on('data', (d) => {
  //   const data = xmodemDecode(d);
  //   data.forEach((d) => {
  //     const { commandType, currentPacketNumber } = d;
  //     const ackPacket = ackData(
  //       ACK_PACKET,
  //       `0x${currentPacketNumber.toString(16)}`
  //     );
  //     connection.write(Buffer.from(`aa${ackPacket}`, 'hex'));
  //     console.log(d);
  //   });
  // });

  connection.on('error', (d) => {
    console.log(d);
  });
};


 process.on('SIGINT', function (code) {
    console.log('SIGINT received...');
    process.exit();
});



getPort();
