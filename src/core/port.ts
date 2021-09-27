import OrgSerialPort from 'serialport';
import MockSerialPort from './mock/serialport';
import SerialPort from '../config/serialport';
import config from '../config/constants';

export const closePort = (port: any) => {
  port.close();
};

export const createPortConnection = (port: any) => {
  const hardwarePort = SerialPort(port, {
    baudRate: 115200,
    autoOpen: false,
  });
  return hardwarePort;
};

export const createPort = async () => {
  let list: OrgSerialPort.PortInfo[] = [];
  if (process.env.MOCK === 'true') {
    list = await MockSerialPort.list();
  } else {
    list = await OrgSerialPort.list();
  }

  let port;
  list.forEach((portParam) => {
    const { vendorId } = portParam;
    if (vendorId && String(vendorId) === config.VENDOR_ID) {
      port = portParam;
    }
  });

  if (!port) {
    throw new Error('Device not connected');
  } else {
    const { path, serialNumber: deviceSerialNumber } = port;
    return {
      connection: createPortConnection(path),
      serial: deviceSerialNumber,
    };
  }
};

export const openConnection = (connection: OrgSerialPort | MockSerialPort) => {
  return new Promise((resolve, reject) =>
    connection.open((err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    })
  );
};

export const closeConnection = (connection: OrgSerialPort | MockSerialPort) => {
  return new Promise((resolve, reject) => {
    if (connection.isOpen) {
      resolve();
      return;
    }

    connection.close((err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};
