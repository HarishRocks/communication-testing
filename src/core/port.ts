import OrgSerialPort from 'serialport';
import MockSerialPort from './mock/serialport';
import SerialPort from '../config/serialport';
import config from '../config/constants';

const closePort = (port: any) => {
  port.close();
};

const createPortConnection = (port: any) => {
  const hardwarePort = SerialPort(port, {
    baudRate: 115200,
    autoOpen: false,
  });
  return hardwarePort;
};

const createPort = async () => {
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

export { createPort, closePort };
