import { createPort, openConnection, closeConnection } from '../core/port';
import { ackData, sendData } from '../core/sendData';
import { recieveData, receiveCommand } from '../core/recieveData';
import deviceReady from '../core/deviceReady';
import axios from 'axios';
import crypto from 'crypto';
const cyBaseURL =
  'http://cypherockserver-env.eba-hvatxy8g.ap-south-1.elasticbeanstalk.com';

const sha256 = (message: string) => {
  const hash = crypto.createHash('sha256');
  hash.update(Buffer.from(message, 'hex'));
  return (message = hash.digest('hex'));
};

const verifySerialSignature = async (
  serial: any,
  signature: any,
  message: any
) => {
  const res: any = await axios.post(`${cyBaseURL}/verification/verify`, {
    serial,
    signature,
    message,
  });
  console.log(res.data);
  if (res.data.status) {
    console.log('Challenge = ' + res.data.challenge);
    return res.data.challenge;
  } else return 0;
};

const verifyChallengeSignature = async (
  serial: string,
  signature: string,
  challenge: string
) => {
  const res: any = await axios.post(`${cyBaseURL}/verification/challenge`, {
    serial,
    signature,
    challenge,
    //Dont know why it's needed at the moment.
    firmwareVersion: '1.1.1',
  });

  console.log(res.data);
};

const cardAuth = async () => {
  const { connection, serial } = await createPort();
  console.log('Serial Number: ' + serial);
  await openConnection(connection);

  const ready = await deviceReady(connection);
  if (ready) {
    await sendData(connection, 70, '00');

    recieveData(connection).then((res) => console.log(res));

    const receivedHash: any = await receiveCommand(connection, 13);
    console.log('receivedHash: ', receivedHash);

    const serial = receivedHash.slice(128).toUpperCase();
    const serialSignature = receivedHash.slice(0, 128);

    console.log({ serial, serialSignature });

    const challenge = await verifySerialSignature(
      serial,
      serialSignature,
      sha256(serial)
    );

    if (!challenge) {
      console.log('Not verified');
      return 0;
    }

    await sendData(connection, 16, challenge);

    const challengeHash: any = await receiveCommand(connection, 17);
    console.log('challengeHash :', challengeHash);

    const challengeSignature = challengeHash.slice(0, 128);
    console.log({ challengeSignature });

    const verified = await verifyChallengeSignature(
      serial,
      challengeSignature + '1',
      challenge
    );
  } else {
    console.log('device not ready');
  }
  await closeConnection(connection);
};

export default cardAuth;
