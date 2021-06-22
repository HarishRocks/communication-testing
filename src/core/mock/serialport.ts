import OrgSerialPort from 'serialport';
import fs from 'fs';
import { EventEmitter } from 'events';

import config from '../../config/constants';

function getRandomData(length = 10) {
  var randomChars =
    ' ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var result = '';
  for (var i = 0; i < length; i++) {
    result += randomChars.charAt(
      Math.floor(Math.random() * randomChars.length)
    );
  }
  return result;
}

export default class SerialPort extends EventEmitter {
  static list(): Promise<OrgSerialPort.PortInfo[]> {
    return new Promise((resolve) => {
      resolve([
        {
          path: `${config.DEVICE_IN_FILE}|${config.DEVICE_OUT_FILE}`,
          serialNumber: getRandomData(),
          vendorId: config.VENDOR_ID,
        } as OrgSerialPort.PortInfo,
      ]);
    });
  }

  public isOpen: boolean;

  private deviceInFilePath: string;

  private deviceOutFilePath: string;

  private deviceWriter?: fs.WriteStream;

  private lastReadByte: number;

  constructor(path: string) {
    super();

    const filePathArr = path.split('|');
    if (filePathArr.length !== 2) {
      throw new Error('Input output files should be separated by `|`');
    }

    this.isOpen = false;
    this.deviceInFilePath = filePathArr[0];
    this.deviceOutFilePath = filePathArr[1];

    this.lastReadByte = 0;
  }

  public open(callback?: (error?: Error | null) => void) {
    try {
      this.isOpen = true;

      this.deviceWriter = fs.createWriteStream(this.deviceInFilePath);

      // Don't read the previous data
      const stats = fs.statSync(this.deviceOutFilePath);
      this.lastReadByte = stats.size !== 0 ? stats.size - 1 : 0;

      const that = this;
      fs.watchFile(
        this.deviceOutFilePath,
        { persistent: true, interval: 100 },
        () => {
          that._onFileChange();
        }
      );
      if (callback) {
        callback();
      }
    } catch (error) {
      if (callback) {
        callback(error);
      } else {
        throw error;
      }
    }
  }

  public write(
    chunk: any,
    callback?: (error: Error | null | undefined, bytesWritten: number) => void
  ): boolean {
    if (!this.isOpen) {
      if (callback) {
        callback(new Error('SerialPort is closed'), 0);
      }
      return false;
    }

    if (!this.deviceWriter) {
      if (callback) {
        callback(new Error('Device writer not found'), 0);
      }
      return false;
    }

    this.deviceWriter.write(chunk, (err) => {
      if (callback) {
        callback(err, Buffer.byteLength(chunk));
      }
    });
    return true;
  }

  public close(callback?: (error?: Error | null) => void) {
    try {
      if (this.isOpen) {
        this.isOpen = false;
        fs.unwatchFile(this.deviceOutFilePath);
      }
      this.emit('close');
      if (callback) {
        callback();
      }
    } catch (error) {
      if (callback) {
        callback(error);
      } else {
        throw error;
      }
    }
  }

  public flush() {}

  private async _onFileChange() {
    try {
      const readStream = fs.createReadStream(this.deviceOutFilePath, {
        start: this.lastReadByte,
      });

      const data: Buffer[] = [];

      readStream.on('data', (chunk: Buffer) => {
        data.push(chunk);
        this.lastReadByte += Buffer.byteLength(chunk) - 1;
      });

      readStream.on('end', () => {
        readStream.close();
        this.emit('data', Buffer.concat(data));
      });

      readStream.on('error', (err) => {
        console.error(err);
        readStream.close();
      });
    } catch (error) {
      console.error(error);
    }
  }
}
