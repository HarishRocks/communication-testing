import { exec } from 'child_process';
import { promisify } from 'util';

const asyncExec = promisify(exec);

const disableSwd = async () => {
  try {
    const { stderr, stdout } = await asyncExec(
      'nrfjprog --memwr 0x10001208 --val 0xFFFFFF00'
    );
    if (stderr) {
      console.log(`stderr: ${stderr}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
  } catch (error) {
    if (error) {
      console.log(`Error occured`);
      console.log(error);
      return;
    }
  }
};

export default disableSwd;
