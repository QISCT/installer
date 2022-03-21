import prompt from './prompt/index.js';
import { writeFileSync, readFileSync } from "fs";
import path, { dirname } from 'path';
import process from 'process';
import fetch from 'node-fetch';
import { Octokit } from "octokit";
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const octokit = new Octokit();
const symfonyLatest = octokit.request('GET /repos/{owner}/{repo}/releases/latest', {
  owner: 'symfony',
  repo: 'symfony'
})
const privatePackages = fetch('https://packages.quasarwebdev.com/packages.json').then(res => res.json())

const config = {};
const rootDir = path.resolve(__dirname, '../');

const askProjectName = () => {
    return prompt.ask({type: "input", default: path.basename(process.cwd()), message: "Project Name"})
}
const askProjectDescription = () => {
    return prompt.ask({type: "input", message: "Project Description (optional)"})
}

const resolveSymfonyVersion = async () => {
    let symfonyVersion = '~' + (await symfonyLatest).data.tag_name.slice(1).split(".", 2).join(".")
    return prompt.ask({
        type: "input",
        default: symfonyVersion,
        message: "Symfony Version"
    })
}

const resolveVersion = async () => {
    return await prompt.ask({
        type: "input",
        message: "Enter the version constraint to require (or leave blank to use the latest version)",
    })
}

const basePackages = async() => {
    let symfonyVersion = await resolveSymfonyVersion();
    try {
        const json = readFileSync(rootDir + '/resources/default.json', 'utf8').replaceAll('<symfonyVersion>', symfonyVersion);
        return JSON.parse(json);
    } catch (err) {
        console.error(err)
    }
};

const qisPackages = async () => {
    let packages = await prompt.ask({
        type: "checkbox",
        choices: (await privatePackages)['available-packages'],
        message: "QIS Packages",
    });
    return Object.fromEntries(packages.map(pkg => [pkg, '*']))
}

const externalPackages = async () => {
    let packages = {};
    const addPackage = ({pkg, version}) => {
        packages[pkg] = version;
    }

    let active = await prompt.ask({
            type: "confirm",
            message: "Would you like to add external packages",
        });
    while(active) {
        let pkg = await prompt.ask({
            type: "input",
            message: "Package Name",
        })
        if(pkg === '')
            break;

        let answer = await addPackagePrompt(pkg);
        if(answer.success)
            addPackage(answer);

        active = await prompt.ask({
            type: "confirm",
            message: "Add another external package",
        })
    }
    return packages;
}
const addPackagePrompt = async (search) => {
    return await new Promise((resolve) => {
        fetch(`https://packagist.org/search.json?q=${search}`)
        .then(res => res.json())
        .then(async ({results}) => {
            let pkg = null;
            const packageList = results.map(p => p.name);
            
            if(!packageList.length) {
                prompt.outputDanger(`No packages found matching: '${search}'`);
                return resolve({success: false});
            } else if(packageList.length == 1) {
                pkg = packageList[0].trim();
            } else {
                pkg = (await prompt.ask({
                    type: "list",
                    loop: false,
                    choices: ['CANCEL', new prompt.inquirer.Separator(), ...packageList],
                    default: packageList[0],
                    message: `Found ${packageList.length} packages matching ${search}`,
                })).trim();
                if(pkg == 'CANCEL')
                    return resolve({success: false});
            }
                
            const version = (await resolveVersion(pkg));
            
            resolve({pkg, version: version != '' ? version : '*', success: true});
        });
    });
}

const writeConfig = () => {
    writeFileSync(
        process.cwd() + '/composer.json',
        buildConfig(),
        err => console.error(err)
    )
    prompt.outputSuccess('Config written to composer.json');
};

const buildConfig = () => {
    config.packages = Object.assign(config.basePackages, config.privatePackages, config.externalPackages);
    let composerConfig = '';
    try {
        composerConfig += readFileSync(rootDir + '/resources/base.json', 'utf8');
    } catch (err) {
        console.error(err)
    }
    for(let [key, val] of Object.entries(config)) {
        val = val instanceof Object ? JSON.stringify(val, null, 2) : val;
        composerConfig = composerConfig.replaceAll(`<${key}>`, val);
    }
    
    return composerConfig;
};


export default async function(name) {
    config.name = 'qisct/' + await askProjectName();
    config.description = await askProjectDescription();
    config.basePackages = await basePackages();
    config.privatePackages = await qisPackages();
    config.externalPackages = await externalPackages();
    await writeConfig();
};