import util from 'util';
import {spawn} from 'child_process';
import open from 'open';
// const promiseExec = util.promisify(execFile);

const getCli = async () => {
    open('https://www.google.com/');
}

export default async function(name) {
    getCli();
    // const { out1, out2 } = await promiseExec('../scripts/auth.sh');
    // console.log('stdout:', stdout);
    // console.log('stderr:', stderr);
    const shell = spawn('../scripts/auth.sh', ['-i'], { stdio: 'inherit' })
    shell.on('close',(code)=>{console.log('[shell] terminated :',code)})
};