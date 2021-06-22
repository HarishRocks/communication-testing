import OrgSerialPort from 'serialport';
import MockSerialPort from '../core/mock/serialport';

export type SerialPortType = OrgSerialPort | MockSerialPort;

const SerialPort = (
  path: string,
  options?: OrgSerialPort.OpenOptions,
  callback?: OrgSerialPort.ErrorCallback
) => {
  if (process.env.MOCK === 'true') {
    return new MockSerialPort(path);
  }

  return new OrgSerialPort(path, options, callback);
};

export default SerialPort;
