//ToDo add this.token in secrets for public repository
//ToDo remove all xpub parameters (done)
//ToDo Get the funds_check function approved by Vipul sir.
//ToDO fetch the feerate from an API.
//ToDo solve discripency between generate_metadata, and generate_unsigned_transaction, fundscheck. (Input parameters)
const bitcoin = require('bitcoinjs-lib');  
const bip32 = require('bip32');
const axios = require('axios');
const coinselect = require('coinselect');
import { default as COINS } from '../config/coins';

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
export class Wallet{
	//xpub in base58
	constructor( xpub , coinType ){
		this.coinType = coinType;
		this.xpub = xpub;

		let hash = crypto.createHash('sha256').update(xpub).digest('hex').slice(0,32); //because we only need the first 16 bytes

		this.external = `re${hash}`;
		this.internal = `ch${hash}`;
	
		switch (coinType) {
			case COINS.BTC:
				this.network = bitcoin.network.bitcoin;
				break;

			case COINS.BTC_TESTNET:
				this.network = bitcoin.network.testnet;
				break;

			case COINS.LTC:
				this.network = bitcoin.networks.litecoin;
				break;

			case COINS.DASH:
				this.network = bitcoin.networks.dash;
				break;

			case COINS.DOGE:
				this.network = bitcoin.networks.doge;
				break;
		
			default:
				throw new Error('Please Provide a Valid Coin Type');
		}
	}

	//chain, 0 for external, 1 for internal
	address_list(chain, start, end){
		let addresses = [];

		for(let i = start; i<end; i++){
			let address = bitcoin.payments.p2pkh({pubkey: bip32.fromBase58(this.xpub, this.network).derive(chain).derive(i).publicKey, network: this.network}).address;
			addresses.push(address);
		}

		return addresses;
	}



	get_chain_address_index(address){
		
	}

	

	upload_wallet (name, addresses){

		axios.post(
			"https://api.blockcypher.com/v1/btc/test3/wallets?token=5849c99db61a468db0ab443bab0a9a22",
			{
				"name":name,
				"addresses":addresses
			}
		).then(function(response){
			console.log("Adding a new wallet suceessful");
		}).catch(function(error){
			console.log("An error occured:"+error);
		});
	}


	add_addresses_to_online_wallet(name, addresses){
		axios.post(
			"https://api.blockcypher.com/v1/btc/test3/wallets/"+name+"/addresses?token=5849c99db61a468db0ab443bab0a9a22",
			{
				"name":name,
				"addresses":addresses
			}
		).then(function(response){
			console.log("Adding new addresses suceessful");
		}).catch(function(error){
			console.log("An error occured:"+error);
		});
	}


	async fetch_wallet(name){
		let res = await axios.get("http://api.blockcypher.com/v1/btc/test3/addrs/"+name+"?token=5849c99db61a468db0ab443bab0a9a22");
		console.log(res["data"]["wallet"]["addresses"]);
		return res['data'];
	}

	async fetch_utxo(){
		let utxos = []

		let res = await axios.get("http://api.blockcypher.com/v1/btc/test3/addrs/"+this.external+"?token=5849c99db61a468db0ab443bab0a9a22&unspentOnly=true");


		res = res["data"]["txrefs"]

		for(let i in res){
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

		res = await axios.get("http://api.blockcypher.com/v1/btc/test3/addrs/"+this.internal+"?token=5849c99db61a468db0ab443bab0a9a22&unspentOnly=true");

		res = res["data"]["txrefs"]

		for(let i in res){
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

	async get_change_address(){
		let change_addresses = await axios.get("https://api.blockcypher.com/v1/btc/test3/addrs/"+this.internal+"?token=5849c99db61a468db0ab443bab0a9a22");
		change_addresses = change_addresses["data"];

		let original_length = change_addresses["wallet"]["addresses"].length;


		let change_add = undefined;
		for(let i in change_addresses["txrefs"]){
			if(change_addresses["wallet"]["addresses"].includes(change_addresses["txrefs"][i]["address"]))
			{
				change_addresses["wallet"]["addresses"].splice(i,1);
				break;
			}
		}

		if(change_addresses["wallet"]["addresses"].length == 0){
			change_add = this.address_list(this.xpub, 1, original_length, original_length+1)[0];
		}
		else{
			change_add = change_addresses["wallet"]["addresses"][0];
		}

		return change_add;
	}


	

	//checks if the user has enough funds for a transaction using the coinselect library
	//returns 1 if funds are available, 0 if not. 

	async funds_check( output_addresses , amounts ){

		let targets = [];

		for( let i in output_addresses){
			let t = {
				"address" : output_addresses[i],
				"value" : amounts[i]
			};
			targets[i] = t;
		}

		let utxos = await this.fetch_utxo();
		let {inputs, outputs, fee}  = coinselect(utxos, targets, 10);

		if( !inputs || !ouputs )
		{
			return 0;
		}

		return 1;

	}

	//Output list is 
	//let output = [
	// {
	//     "address":output_address,
	//     "value":amount
	// }];
	//Yet to complete this function.
	generateMetaData = (outputList) => {
		let purposeIndex = "8000002c";
		let coinIndex;
	
		if( this.coinType === COINS.BTC) //x  
			coinIndex = "80000000";
		if( this.coinType === COINS.BTC_TESTNET )
			coinIndex = "80000001";
		if( this.coinType === COINS.LTC)
			coinIndex = "80000002";
		if( this.coinType === COINS.DASH)
			coinIndex = "80000005";
		if( this.coinType === COINS.DOGE)
			coinIndex = "80000003";
	
		let accountIndex = "80000000";
	
		let utxos = fetch_utxo(recieve, change);
	
		let feeRate = 50 //Yet to fetch this from an API
	
		let { inputs, outputs, fee } = coinSelect(utxos, outputList, feeRate)
				
		let change_add = await this.get_change_address();

		for(let i in outputs){
			if(!("address" in outputs[i])){
				outputs[i]["address"] = change_add;
			}
		}

		let input_count = String(inputs.length);
		


		
		
	}

	//output_addresses is a list of addresses, amounts is a list of amounts. 
	async generate_unsigned_transaction( output_addresses , amounts ){
		
		let change_add = await this.get_change_address();

		let targets = [
		{
			"address":output_address,
			"value":amount
		}];

		let utxos = await this.fetch_utxo();
		let {inputs, outputs, fee}  = coinselect(utxos, targets, 10);


		for(let i in outputs){
			if(!("address" in outputs[i])){
				outputs[i]["address"] = change_add;
			}
		}

		for(let i in inputs){
			inputs[i]["scriptPubKey"] = bitcoin.address.toOutputScript(inputs[i]["address"],this.network);
		}

		let txBuilder = new bitcoin.TransactionBuilder(this.network);

	    for(let i in inputs){
	        let input = inputs[i];
	        var scriptPubKey = input["scriptPubKey"];
	        txBuilder.addInput(input.txId, input.vout, 0xffffffff, Buffer.from(scriptPubKey, 'hex'));
	    }


	    for(let i = 0; i < outputs.length; i++){
	        let output = outputs[i];
	        console.log(output);
	        txBuilder.addOutput(output.address, output.value);
	    }


	    let tx = txBuilder.buildIncomplete()


	    for(let i in inputs){
	        let input = inputs[i];

	        tx.ins[i].script = Buffer.from(input.scriptPubKey, 'hex');
	    }

	    console.log(tx.toHex());
	    return tx.toHex();
	}
}