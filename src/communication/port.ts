import SerialPort from 'serialport';

const closePort = (port: any) => {
  port.close();
};

const createPortConnection = (port: any) => {
  const hardwarePort = new SerialPort(port, {
    baudRate: 115200,
    autoOpen: false,
  });
  return hardwarePort;
};

const createPort = async () => {
  const list = await SerialPort.list();
  let port;
  list.forEach((portParam) => {
    const { vendorId } = portParam;
    if (vendorId && vendorId == '1915') {
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
