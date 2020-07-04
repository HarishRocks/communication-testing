const  Transaction = require('ethereumjs-tx').Transaction;
var util = require('ethereumjs-util');
var Web3 = require('web3');

var web3 = new Web3(new Web3.providers.HttpProvider('https://ropsten.infura.io/v3/a4f75c8bc5324e10b1b54f79f4e84986'));

const createRawTx = async (address, gasPrice, gasLimit, value) => {
    var rawTx = {
        nonce: await web3.eth.getTransactionCount('0xA4028f8dC64D18F0a66668d97473C47444A561Ea'),
        gasPrice: Web3.utils.toHex(20000000000),
        gasLimit: Web3.utils.toHex(100000),
        to: address,
        value: Web3.utils.toHex(1000),
    };

    var transaction = new Transaction(rawTx);

    console.log(transaction.serialize().toString('hex'));
}

const getBalance = async (address) => {
    let balance = web3.eth.getBalance('0xA4028f8dC64D18F0a66668d97473C47444A561Ea');
    return balance;
}

// createRawTx('0x687422eEA2cB73B5d3e242bA5456b782919AFc85');