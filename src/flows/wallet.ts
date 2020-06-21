//ToDo add this.token in secrets for public repository
//ToDo remove all xpub parameters (done)
//ToDo Get the funds_check function approved by Vipul sir.
//ToDO fetch the feerate from an API.
//ToDo solve discripency between generate_metadata, and generate_unsigned_transaction, fundscheck. (Input parameters)
//ToDo feerate https://api.blockcypher.com/v1/btc/main 
const bitcoin = require('bitcoinjs-lib');
// import { default as bip32 } from 'bip32';
const bip32 = require('bip32');
import {default as axios} from 'axios';
// const axios = require('axios');
const coinselect = require('coinselect');
import { coins as COINS } from '../config';
import { intToUintByte, hexToAscii } from '../bytes';
import { resolve } from 'path';
import { default as crypto } from 'crypto';
// const crypto = require('crypto');
// const Datastore = require('nedb');
import { default as Datastore } from 'nedb';

bitcoin.networks.litecoin = {
	messagePrefix: '\x19Litecoin Signed Message:\n',
	bip32: {
		public: 0x0488b21e,
		private: 0x0488ade4,
	},
	pubKeyHash: 0x30,
	scriptHash: 0x32,
	wif: 0xb0
};

bitcoin.networks.dash = {
	messagePrefix: '\x19Dashcoin Signed Message:\n',
	bip32: {
		public: 0x0488b21e,
		private: 0x0488ade4
	},
	pubKeyHash: 0x4c,
	scriptHash: 0x10,
	wif: 0xcc
};

bitcoin.networks.doge = {
	messagePrefix: '\x19Dogecoin Signed Message:\n',
	bip32: {
		public: 0x02facafd,
		private: 0x02fac398
	},
	pubKeyHash: 0x1e,
	scriptHash: 0x16,
	wif: 0x9e
};



//Class Wallet:
//Can be built from an xPub and coin_type
// BTC
// BTC_TESTNET
// DOGE
// DASH
// LTC
export class Wallet {
	//xpub in base58
	coinType: string;
	xpub: string;
	external: string;
	internal: string;
	network: any;
	coin_url: string;
	api_url: string;

	constructor(xpub: any, coinType: any) {
		this.coinType = coinType;
		this.xpub = xpub;

		let hash = crypto.createHash('sha256').update(xpub).digest('hex').slice(0, 10); //because we only need the first 16 bytes

		this.external = `re${hash}`;
		this.internal = `ch${hash}`;


		switch (coinType) {
			case COINS.BTC:
				this.network = bitcoin.networks.bitcoin;
				this.coin_url = "btc/main/";
				break;

			case COINS.BTC_TESTNET:
				this.network = bitcoin.networks.testnet;
				this.coin_url = "btc/test3/";
				break;

			case COINS.LTC:
				this.network = bitcoin.networks.litecoin;
				this.coin_url = "ltc/main/";
				break;

			case COINS.DASH:
				this.network = bitcoin.networks.dash;
				this.coin_url = "dash/main/";
				break;

			case COINS.DOGE:
				this.network = bitcoin.networks.doge;
				this.coin_url = "doge/main/";
				break;

			default:
				throw new Error('Please Provide a Valid Coin Type');
		}

		this.api_url = "http://api.blockcypher.com/v1/" + this.coin_url;
	}

	//chain, 0 for external, 1 for internal
	address_list(chain: number, start: number, end: number) {
		let addresses = [];

		for (let i = start; i < end; i++) {
			let address = bitcoin.payments.p2pkh({ pubkey: bip32.fromBase58(this.xpub, this.network).derive(chain).derive(i).publicKey, network: this.network }).address;
			addresses.push(address);
		}

		return addresses;
	}


	upload_wallet(name: string, addresses: any) {
		console.log({
			"name": name,
			"addresses": addresses
		});
		console.log(this.api_url + "wallets?token=5849c99db61a468db0ab443bab0a9a22");
		axios.post(
			this.api_url + "wallets?token=5849c99db61a468db0ab443bab0a9a22",
			{
				"name": name,
				"addresses": addresses
			}
		).then(function (response: any) {
			console.log("Adding a new wallet suceessful");
		}).catch(function (error: any) {
			console.log("An error occured:" + error);
		});
	}


	add_addresses_to_online_wallet(name: string, addresses: any) {
		axios.post(
			this.api_url + "wallets/" + name + "/addresses?token=5849c99db61a468db0ab443bab0a9a22",
			{
				"name": name,
				"addresses": addresses
			}
		).then(function (response: any) {
			console.log("Adding new addresses suceessful");
		}).catch(function (error: any) {
			console.log("An error occured:" + error);
		});
	}


	async fetch_wallet(name: string) {
		let res = await axios.get(this.api_url + "/addrs/" + name + "?token=5849c99db61a468db0ab443bab0a9a22");
		console.log(res["data"]["wallet"]["addresses"]);
		return res['data'];
	}

	async fetch_utxo() {
		let utxos = []

		let res : any = await axios.get("http://api.blockcypher.com/v1/btc/test3/addrs/" + this.external + "?token=5849c99db61a468db0ab443bab0a9a22&unspentOnly=true");


		res = res["data"]["txrefs"]

		for (let i in res) {
			// addresses.push(res["data"]["txrefs"][i]["address"]);

			let utxo = {
				"address": res[i].address,
				"txId": res[i].tx_hash,
				"vout": res[i].tx_output_n,
				"value": res[i].value,
				"block_height": res[i].block_height,
				"vin": res[i].tx_input_n,
				"ref_balance": res[i].ref_balance,
				"confirmations": res[i].confirmations
			}

			utxos.push(utxo);
		}

		res = await axios.get("http://api.blockcypher.com/v1/btc/test3/addrs/" + this.internal + "?token=5849c99db61a468db0ab443bab0a9a22&unspentOnly=true");

		res = res["data"]["txrefs"]

		for (let i in res) {
			// addresses.push(res["data"]["txrefs"][i]["address"]);

			let utxo = {
				"address": res[i].address,
				"txId": res[i].tx_hash,
				"vout": res[i].tx_output_n,
				"value": res[i].value,
				"block_height": res[i].block_height,
				"vin": res[i].tx_input_n,
				"ref_balance": res[i].ref_balance,
				"confirmations": res[i].confirmations
			}

			utxos.push(utxo);
		}
		// console.log(utxos);
		return utxos;
	}

	async get_total_balance() {

		let res : any = await axios.get("http://api.blockcypher.com/v1/btc/test3/addrs/" + this.external + "?token=5849c99db61a468db0ab443bab0a9a22&unspentOnly=true");

		let balance = res.balance;
		let unconfirmed_balance = res.unconfirmed_balance;
		let final_balance = res.final_balance;

		res = await axios.get("http://api.blockcypher.com/v1/btc/test3/addrs/" + this.internal + "?token=5849c99db61a468db0ab443bab0a9a22&unspentOnly=true");

		balance = balance + res.balance;
		unconfirmed_balance = unconfirmed_balance + res.unconfirmed_balance;
		final_balance = final_balance + res.final_balance;

		return { balance, unconfirmed_balance, final_balance };
	}


	//get unused change address
	async get_change_address() {
		let change_addresses : any = await axios.get("https://api.blockcypher.com/v1/btc/test3/addrs/" + this.internal + "?token=5849c99db61a468db0ab443bab0a9a22");
		change_addresses = change_addresses["data"];

		let original_length = change_addresses["wallet"]["addresses"].length;


		let change_add = undefined;
		for (let i in change_addresses["txrefs"]) {
			if (change_addresses["wallet"]["addresses"].includes(change_addresses["txrefs"][i]["address"])) {
				change_addresses["wallet"]["addresses"].splice(i, 1);
				break;
			}
		}

		if (change_addresses["wallet"]["addresses"].length == 0) {
			change_add = this.address_list(1, original_length, original_length + 1)[0];
		}
		else {
			change_add = change_addresses["wallet"]["addresses"][0];
		}

		return change_add;
	}

	//get unused recieve address
	async get_recieve_address() {
		let recieveAddress : any = await axios.get("https://api.blockcypher.com/v1/btc/test3/addrs/" + this.external + "?token=5849c99db61a468db0ab443bab0a9a22");
		recieveAddress = recieveAddress["data"];

		let original_length = recieveAddress["wallet"]["addresses"].length;

		let recieve_add = undefined;
		for (let i in recieveAddress["txrefs"]) {
			if (recieveAddress["wallet"]["addresses"].includes(recieveAddress["txrefs"][i]["address"])) {
				recieveAddress["wallet"]["addresses"].splice(i, 1);
				break;
			}
		}

		if (recieveAddress["wallet"]["addresses"].length == 0) {
			recieve_add = this.address_list(1, original_length, original_length + 1)[0];
		}
		else {
			recieve_add = recieveAddress["wallet"]["addresses"][0];
		}

		return recieve_add;
	}


	//checks if the user has enough funds for a transaction using the coinselect library
	//returns 1 if funds are available, 0 if not. 
	async funds_check(output_addresses: any, amounts: any) {

		let targets: any = [];

		for (let i in output_addresses) {
			let t = {
				"address": output_addresses[i],
				"value": amounts[i]
			};
			targets[i] = t;
		}

		let utxos = await this.fetch_utxo();
		let { inputs, outputs, fee } = coinselect(utxos, targets, 10);

		if (!inputs || !outputs) {
			return 0;
		}

		return 1;

	}


	get_chain_address_index(address: string) {
		//1000 is a soft limit. It suggests that the address provided may be wrong, but that is a rare case
		let chain_index;
		let address_index;
		for (let i = 0; i < 1000; i++) {
			if (address == bitcoin.payments.p2pkh({ pubkey: bip32.fromBase58(this.xpub, this.network).derive(0).derive(i).publicKey, network: this.network }).address) {
				chain_index = 0;
				address_index = i;
				break;
			}

			if (address == bitcoin.payments.p2pkh({ pubkey: bip32.fromBase58(this.xpub, this.network).derive(1).derive(i).publicKey, network: this.network }).address) {
				chain_index = 1;
				address_index = i;
				break;
			}
		}

		return { chain_index, address_index };
	}


	//Output list is 
	//let output = [
	// {
	//     "address":output_address,
	//     "value":amount
	// }];
	//Yet to complete this function.

	generateMetaData = async (outputList: any) => {
		let purposeIndex = "8000002c";
		let coinIndex;

		if (this.coinType === COINS.BTC) //x  
			coinIndex = "80000000";
		if (this.coinType === COINS.BTC_TESTNET)
			coinIndex = "80000001";
		if (this.coinType === COINS.LTC)
			coinIndex = "80000002";
		if (this.coinType === COINS.DASH)
			coinIndex = "80000005";
		if (this.coinType === COINS.DOGE)
			coinIndex = "80000003";

		let accountIndex = "80000000";

		let utxos = await this.fetch_utxo();

		let feeRate = 500 //Yet to fetch this from an API

		let { inputs, outputs, fee } = coinselect(utxos, outputList, feeRate)

		let change_add = await this.get_change_address();

		let input_count = String(inputs.length);

		//all inputs: their chain index and address index
		let input_string = ''

		for (let i in inputs) {
			let ch_addr_in = this.get_chain_address_index(inputs[i].address);
			input_string = input_string + intToUintByte(ch_addr_in.chain_index, 32);
			input_string = input_string + intToUintByte(ch_addr_in.address_index, 32);
		}

		let output_count = 1;
		let output_string = '0000000000000000';

		// for (let i in outputs) {
		// 	if ("address" in outputs[i]) {
		// 		let ch_addr_in = this.get_chain_address_index(outputs[i].address);
		// 		output_string = output_string + intToUintByte(ch_addr_in.chain_index, 32);
		// 		output_string = output_string + intToUintByte(ch_addr_in.address_index, 32);
		// 		output_count++;
		// 	}
		// }

		let change_count = 0;
		let change_string = '';
		console.log(outputs);
		for (let i in outputs) {
			if (!("address" in outputs[i])) {
				let ch_addr_in = this.get_chain_address_index(change_add);
				change_string = change_string + intToUintByte(ch_addr_in.chain_index, 32);
				change_string = change_string + intToUintByte(ch_addr_in.address_index, 32);
				change_count++;
			}
		}
		console.log(purposeIndex + " " + coinIndex + " " + accountIndex + " " + intToUintByte(input_count,8) + " " + input_string + " " + intToUintByte(output_count,8) + " " + output_string + " " + intToUintByte(change_count,8) + " " + change_string);
		return purposeIndex + coinIndex + accountIndex + intToUintByte(input_count,8) + input_string + intToUintByte(output_count,8) + output_string + intToUintByte(change_count,8) + change_string;

	}

	//Output list is 
	//let targets = [
	// {
	//     "address":output_address,
	//     "value":amount
	// }];
	//Yet to complete this function.
	async generate_unsigned_transaction(targets: any) {

		let change_add = await this.get_change_address();

		let utxos = await this.fetch_utxo();
		let { inputs, outputs, fee } = coinselect(utxos, targets, 10);


		for (let i in outputs) {
			if (!("address" in outputs[i])) {
				outputs[i]["address"] = change_add;
			}
		}

		for (let i in inputs) {
			inputs[i]["scriptPubKey"] = bitcoin.address.toOutputScript(inputs[i]["address"], this.network);
		}

		let txBuilder = new bitcoin.TransactionBuilder(this.network);

		for (let i in inputs) {
			let input = inputs[i];
			var scriptPubKey = input["scriptPubKey"];
			txBuilder.addInput(input.txId, input.vout, 0xffffffff, Buffer.from(scriptPubKey, 'hex'));
		}


		for (let i = 0; i < outputs.length; i++) {
			let output = outputs[i];
			console.log(output);
			txBuilder.addOutput(output.address, output.value);
		}


		let tx = txBuilder.buildIncomplete()


		for (let i in inputs) {
			let input = inputs[i];

			tx.ins[i].script = Buffer.from(input.scriptPubKey, 'hex');
		}

		console.log(tx.toHex());
		return tx.toHex();
	}

	create_derivation_path = async () => {
		let recieve_address = await this.get_recieve_address();

		let purposeIndex = "8000002c";
		let coinIndex;

		if (this.coinType === COINS.BTC) //x  
			coinIndex = "80000000";
		if (this.coinType === COINS.BTC_TESTNET)
			coinIndex = "80000001";
		if (this.coinType === COINS.LTC)
			coinIndex = "80000002";
		if (this.coinType === COINS.DASH)
			coinIndex = "80000005";
		if (this.coinType === COINS.DOGE)
			coinIndex = "80000003";

		let accountIndex = "80000000";

		let internal_external_index = "00000000";

		let address_index = intToUintByte(this.get_chain_address_index(recieve_address).address_index , 32);

		return purposeIndex + coinIndex + accountIndex + internal_external_index + address_index;

	}
}

export const allAvailableWallets = () => {
	let db = new Datastore({ filename: 'db/wallet_db.db', autoload: true });

	return new Promise((resolve: any, reject: any) => {
		db.find({}, function (err: any, docs: any) {
			if (err) reject(err);
			resolve(docs);
		});
	})
}

export const getXpubFromWallet = (wallet_id: any, coinType: any) => {
	return new Promise(async (resolve, reject) => {
		let db = new Datastore({ filename: 'db/wallet_db.db', autoload: true });

		let wallet_details: any;
		db.findOne({ _id: wallet_id }, function (err: any, doc: any) {
			wallet_details = doc;
			let xpub: any;
			for (let i in wallet_details.xPubs) {
				if (wallet_details.xPubs[i].coinType === coinType) {
					xpub = wallet_details.xPubs[i].xPub;
				}
			}
			resolve(xpub);
		});
	});

}


export const extractWalletDetails = (rawData : any) => {

	let name = hexToAscii(String(rawData).slice(0, 32));
	let passwordSet = String(rawData).slice(32, 34);
	let _id = String(rawData).slice(34);

	return {name, passwordSet, _id};
}

//Author: Gaurav Agarwal
//@method Takes raw data, converts the name from hex to String, and keeps the id in hex itself, and stores it in the database.
//@var rawData : hex data from device
export const addWalletToDB = (rawData: any) => {
	let db = new Datastore({ filename: 'db/wallet_db.db', autoload: true });

	const { name, passwordSet, _id } = extractWalletDetails(rawData);

	db.insert({ name: name, passwordSet: passwordSet, _id: _id, xPubs: [] });
}

export const deleteWalletfromDB = (wallet_id: any) => {
	let db = new Datastore({ filename: 'db/wallet_db.db', autoload: true });

	db.remove({ _id: wallet_id }, {}, function (err: any, numRemoved: any) {
		if (err) {
			console.log("Error");
		}
	});
}

export const addCoinsToDB = (wallet_id : any, account_xpub: any, coinType: any) => {
	return new Promise(async (resolve,reject)=>{
		let db = new Datastore({ filename: 'db/wallet_db.db', autoload: true });
		db.update({ _id: wallet_id }, { $push: { xPubs: { coinType: coinType, xPub: account_xpub } } }, {}, function () {
			console.log(`Added xPub : ${account_xpub} to the database.`);
			resolve(true);
		  });
	  
	})
}

export const getCoinsFromWallet = (wallet_id: any) => {
	return new Promise(async (resolve, reject) => {
		let db = new Datastore({ filename: 'db/wallet_db.db', autoload: true });

		let wallet_details: any;
		db.findOne({ _id: wallet_id }, function (err: any, doc: any) {
			let coins: any = [];
			for (let i in doc.xPubs) {
				coins[i] = doc.xPubs[i].coinType;
			}
			resolve(coins);
		});
	});

}

// module.exports = {Wallet};