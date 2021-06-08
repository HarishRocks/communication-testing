import { exec } from 'child_process';
import { promisify } from 'util';

const asyncExec = promisify(exec);

let command = 'nrfjprog';

if (process.platform === 'win32') {
  command = 'nrfjprog.exe';
}

const enableSwd = async () => {
  try {
    const { stderr, stdout } = await asyncExec(`${command} -f NRF52 --recover`);
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

export default enableSwd;
