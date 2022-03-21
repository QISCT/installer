import process from 'process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import setupGit from './setupGit.js';
import setupPackages from './setupPackages.js';

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)



const run = async () => {
    await setupPackages()
    await setupGit();
    
    process.exit(0);
};

run();