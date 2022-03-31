import {
  receiveCommand as commReceiveCommand,
  PacketVersionMap,
} from '@cypherock/communication';
import SerialPort from 'serialport';
import { SerialPortType } from '../config/serialport';
import { xmodemDecode } from '../xmodem/index';
import { ackData } from './sendData';
import { commands } from '../config';
const { ACK_PACKET, NACK_PACKET } = commands;

// returns the received data value in hex for the supplied command
export const receiveCommand = (
  connection: SerialPortType,
  command: any,
  timeout?: number
): Promise<string> => {
  /**
   * Be sure to remove all listeners and timeout.
   *
   * Using functions for listeners to be able to refer to them before declaration
   * in setTimeout.
   *
   * Using onClose hooks to check if the connection has been closed. If this is not
   * present then the function will wait for the command even after the device has been
   * disconneced.
   */
  if (connection instanceof SerialPort) {
    return commReceiveCommand(
      connection,
      command,
      PacketVersionMap.v2,
      timeout
    ) as Promise<string>;
  }

  const resData: any = [];
  return new Promise((resolve, reject) => {
    if (!connection.isOpen) {
      reject(new Error('Connection is not open'));
      return;
    }

    let timeoutIdentifier: NodeJS.Timeout | null = null;

    if (timeout) {
      timeoutIdentifier = setTimeout(() => {
        connection.removeListener('data', eListener);
        connection.removeListener('close', onClose);
        reject(new Error('Receive command timeout.'));
      }, timeout);
    }

    function eListener(packet: any) {
      const data = xmodemDecode(packet);
      // When fetching logs
      if (data[0].commandType === 38) {
        resolve(data[0].dataChunk);
        if (timeoutIdentifier) {
          clearTimeout(timeoutIdentifier);
        }
        connection.removeListener('close', onClose);
        connection.removeListener('data', eListener);
        return;
      }

      data.forEach((d) => {
        const { commandType, currentPacketNumber, totalPacket, dataChunk } = d;
        if (commandType === command) {
          resData[currentPacketNumber - 1] = dataChunk;
          const ackPacket = ackData(
            ACK_PACKET,
            `0x${currentPacketNumber.toString(16)}`
          );
          connection.write(Buffer.from(ackPacket, 'hex'));
          if (currentPacketNumber === totalPacket) {
            resolve(resData.join(''));
            if (timeoutIdentifier) {
              clearTimeout(timeoutIdentifier);
            }
            connection.removeListener('data', eListener);
            connection.removeListener('close', onClose);
          }
        } else {
          // Send NACK if invalid command.
          const nackPacket = ackData(
            NACK_PACKET,
            `0x${currentPacketNumber.toString(16)}`
          );
          connection.write(Buffer.from(nackPacket, 'hex'));
        }
      });
    }

    function onClose(err: any) {
      if (timeoutIdentifier) {
        clearTimeout(timeoutIdentifier);
      }
      connection.removeListener('data', eListener);
      connection.removeListener('close', onClose);

      if (err) {
        reject(err);
        return;
      }

      reject(new Error('Connection was closed'));
    }

    connection.on('data', eListener);
    connection.on('close', onClose);
  });
};

// returns the commandType and the data recieved from device
// open channel: will catch every command and data
export const recieveData = (connection: SerialPortType) => {
  const resData: any = [];
  return new Promise((resolve, reject) => {
    const eListener = (packet: any) => {
      const data = xmodemDecode(packet);
      data.forEach((d) => {
        const { commandType, currentPacketNumber, totalPacket, dataChunk } = d;
        resData[currentPacketNumber - 1] = dataChunk;
        const ackPacket = ackData(
          ACK_PACKET,
          `0x${currentPacketNumber.toString(16)}`
        );
        // Don't add the initial `aa` when mocking, this is for the simulator to work properly
        connection.write(Buffer.from(`${ackPacket}`, 'hex'));
        if (currentPacketNumber === totalPacket) {
          resolve({ commandType, data: resData.join('') });

          /**
           * We don't have to remove listener for this this one as this
           * one is for internal usages, global listener
           * in case need to test listener uncomment line below
           */
          // connection.removeListener('data', eListener)
        }
      });
    };
    connection.on('data', eListener);
  });
};
