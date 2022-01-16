//ToDo : better naming of this file
import os from 'os';
import path from 'path';

const tempDir = os.tmpdir();

const DEVICE_IN_FILE = path.join(tempDir, 'cypherock_device_in.bin');
const DEVICE_OUT_FILE = path.join(tempDir, 'cypherock_device_out.bin');

export default {
  START_OF_FRAME: 'AAAA',
  ACK_BYTE: '06',
  CHUNK_SIZE: 32 * 2,
  ACK_TIME: 150,
  DEVICE_IN_FILE,
  DEVICE_OUT_FILE,
  VENDOR_ID: process.env.VENDOR_ID,
  SECRET_SEED: process.env.SECRET_SEED || '',
};
