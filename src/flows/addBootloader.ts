import { exec } from 'child_process';
import { promisify } from 'util';

const asyncExec = promisify(exec);

const addBootloader = async () => {
  try {
    const { stderr: eraseError, stdout: eraseOut } = await asyncExec(
      'nrfjprog.exe --eraseall'
    );
    if (eraseError) {
      console.log(`stderr: ${eraseError}`);
      return;
    }
    console.log(`stdout: ${eraseOut}`);

    const { stderr: mbrError, stdout: mbrOut } = await asyncExec(
      'nrfjprog.exe --reset --program "mbr.hex"'
    );
    if (mbrError) {
      console.log(`stderr: ${mbrError}`);
      return;
    }
    console.log(`stdout: ${mbrOut}`);

    const { stderr: bootError, stdout: bootOut } = await asyncExec(
      'nrfjprog.exe --program "bootloader.hex"'
    );
    if (bootError) {
      console.log(`stderr: ${bootError}`);
      return;
    }
    console.log(`stdout: ${bootOut}`);
  } catch (error) {
    if (error) {
      console.log(`Error occured`);
      console.log(error);
      return;
    }
  }
};

export default addBootloader;
