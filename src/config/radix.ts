export default {
  currentPacketNumber: 16,
  totalPacket: 16,
  dataSize: 8,
  commandType: 8 * 4,
  walletIndex: 8,
  coinType: 8,
  futureUse: 8,
  inputOutputCount: 8,
  addressIndex: 32,
  accountIndex: 8,
  crc: 16,
  outputLength: 8,
  addCoins: {
    wallet: 128,
    noOfCoins: 8,
    coinType: 32,
  },
  receiveAddress: {
    coinType: 32,
    accountIndex: 32,
  },
};
