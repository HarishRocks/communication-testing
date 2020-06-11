const bjl = require('bitcoinjs-lib');  
const bip32 = require('bip32');
const axios = require('axios');

const coinselect = require('coinselect');

export class Wallet{
	constructor(network){
		this.network = network;
		this.token = "5849c99db61a468db0ab443bab0a9a22";
	}


	address_list(xpub, chain, start, end){
		let addresses = [];

		for(let i = start; i<end; i++){
			let address = bjl.payments.p2pkh({pubkey: bip32.fromBase58(xpub, this.network).derive(chain).derive(i).publicKey, network: this.network}).address;
			addresses.push(address);
		}

		return addresses;
	}


	add_wallet (name, addresses){

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


	add_addresses(name, addresses){
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
	}

	async fetch_utxo(recieve, change){
		let utxos = []

		let res = await axios.get("http://api.blockcypher.com/v1/btc/test3/addrs/"+recieve+"?token=5849c99db61a468db0ab443bab0a9a22&unspentOnly=true");


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

		res = await axios.get("http://api.blockcypher.com/v1/btc/test3/addrs/"+change+"?token=5849c99db61a468db0ab443bab0a9a22&unspentOnly=true");

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

	async get_change_address(change){
		let change_addresses = await axios.get("https://api.blockcypher.com/v1/btc/test3/addrs/"+change+"?token=5849c99db61a468db0ab443bab0a9a22");
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
			change_add = this.address_list(xpub, 1, original_length, original_length+1)[0];
		}
		else{
			change_add = change_addresses["wallet"]["addresses"][0];
		}

		return change_add;
	}


	async generate_unsigned_transaction(xpub, output_address, amount){

		let change_add = await this.get_change_address("change");

		let targets = [
		{
			"address":output_address,
			"value":amount
		}];

		let utxos = await this.fetch_utxo("external","change");
		let {inputs, outputs, fee}  = coinselect(utxos, targets, 10);


		for(let i in outputs){
			if(!("address" in outputs[i])){
				outputs[i]["address"] = change_add;
			}
		}

		for(let i in inputs){
			inputs[i]["scriptPubKey"] = bjl.address.toOutputScript(inputs[i]["address"],this.network);
		}

		let txBuilder = new bjl.TransactionBuilder(this.network);

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