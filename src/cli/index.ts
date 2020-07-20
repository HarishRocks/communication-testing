// resolved
import receiveTransaction from './handler/receiveTransaction';


// ToDo ask suraj sir about the added_coins in receiveTransaction flow
import {addWallet} from '../flows/addWallet';
import {addCoin, allWalletsList} from '../flows/addCoin';
import cardAuth from '../flows/cardAuth';
import {sendTransaction} from '../flows/sendTransaction';
import {query_list} from '../flows/cli_input';
import customAction from '../flows/custom';

// @ts-ignore
import * as logs from 'simple-node-logger';

const log = logs.createSimpleFileLogger('project.log');

const cliTool = async () => {
    let selection = await query_list([
        'Select Wallet',
        'Add Wallet',
        'Card Authentication',
        'Custom',
    ]);

    switch (selection) {
        case 'Add Wallet':
            log.info('Add Wallet selected');
            await addWallet();
            log.info('Add wallet completed');
            break;
        case 'Card Authentication':
            await cardAuth();
            break;
        case 'Select Wallet':
            log.info('Selecting Wallet');
            const walletId = await query_list(
                await allWalletsList(),
                'Select your wallet'
            );
            log.info('Selected Wallet ID: ' + walletId);

            selection = await query_list([
                'Add Coin',
                'Send Transaction',
                'Recieve Transaction',
            ]);

            switch (selection) {
                case 'Add Coin':
                    log.info('Add coin initiated');
                    await addCoin(walletId, undefined);
                    log.info('Add coin finished');
                    break;
                case 'Send Transaction':
                    log.info('Send transaction initiated');
                    await sendTransaction(walletId, undefined, undefined, undefined);
                    log.info('Send transaction finished');
                    break;

                case 'Recieve Transaction':
                    log.info('Recieve transaction initiated');
                    await receiveTransaction(walletId);
                    log.info('Recieve transaction finished');

                    break;
            }
            break;
        case 'Custom':
            const actions = [
                {
                    type: 'SEND',
                    command: 70,
                    data: '00',
                },
                {
                    type: 'RECEIVE',
                    command: 13,
                },
                {
                    type: 'SEND',
                    command: 16,
                    data: '12345678',
                },
                {
                    type: 'RECEIVE',
                    command: 17,
                },
            ];
            await customAction(actions);
            break;
    }
};

(async () => {
    cliTool().catch()
})();
