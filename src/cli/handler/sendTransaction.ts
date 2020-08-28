import { getCoinType, sendTransaction } from '../../flows/sendTransaction';
import { queryInput, queryList, queryNumber } from '../helper/cliInput';

const makeOutputList = async () => {
  let coinType;
  const outputList = [];

  while (1) {
    if (coinType) {
      const selection = await queryList(
        ['yes', 'no'],
        'Do you want to add more addresses?'
      );
      if (selection === 'no') {
        break;
      }
    }

    const receiverAddress = await queryInput('Input the Recipient Address');
    const amountToSend = await queryNumber('Input the amount in satoshis');

    if (coinType && coinType !== getCoinType(receiverAddress)) {
      console.log('Please enter an addresses for the same coinType as above.');
      continue;
    } else if (!coinType) {
      coinType = getCoinType(receiverAddress);
    }

    outputList.push({
      address: receiverAddress,
      value: amountToSend,
    });
  }

  return { outputList, coinType };
};

export default async (walletId: string) => {
  const { outputList, coinType } = await makeOutputList();
  const feeRate = await queryList(
    [
      { name: 'Low', value: 'l' },
      { name: 'Medium', value: 'm' },
      { name: 'High', value: 'h' },
    ],
    'Select the transaction fees'
  );
  await sendTransaction(walletId, outputList, coinType, feeRate);
};
