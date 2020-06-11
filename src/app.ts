import { addWallet} from './flows/addWallet';
const inquirer = require('inquirer');

(async () => {
    await addWallet();

})().catch( err => console.log(err));

