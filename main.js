const inquirer = require("inquirer");
const chalk = require("chalk");
const figlet = require("figlet");
const shell = require("shelljs");
const fs = require('fs');
const path = require('path');
const process = require('process');
const fetch = require('node-fetch');
const { Octokit } = require("@octokit/core");
const exec = require('child_process').exec;

inquirer.registerPrompt('input', require('./prompt/input'));
inquirer.registerPrompt('checkbox', require('./prompt/checkbox'));
inquirer.registerPrompt('confirm', require('./prompt/confirm'));

const octokit = new Octokit();
const symfonyLatest = octokit.request('GET /repos/{owner}/{repo}/releases/latest', {
  owner: 'symfony',
  repo: 'symfony'
})
const privatePackages = fetch('https://packages.quasarwebdev.com/packages.json').then(res => res.json())

const config = {};
const rootDir = __dirname;

const askProjectName = () => {
    return ask({type: "input", default: path.basename(process.cwd()), message: "Project Name"})
}
const askProjectDescription = () => {
    return ask({type: "input", message: "Project Description (optional)"})
}

const resolveSymfonyVersion = async () => {
    let symfonyVersion = '~' + (await symfonyLatest).data.tag_name.slice(1)
    return ask({
        type: "input",
        default: symfonyVersion,
        message: "Symfony Version"
    })
}

const resolveVersion = async (package) => {
    return await ask({
        type: "input",
        message: "Enter the version constraint to require (or leave blank to use the latest version)",
    })
}

const basePackages = async() => {
    let symfonyVersion = await resolveSymfonyVersion();
    try {
        const json = fs.readFileSync(rootDir + '/resources/default.json', 'utf8').replaceAll('<symfonyVersion>', symfonyVersion);
        return JSON.parse(json);
    } catch (err) {
        console.error(err)
    }
};

const qisPackages = async () => {
    let packages = await ask({
        type: "checkbox",
        choices: (await privatePackages)['available-packages'],
        message: "QIS Packages",
    });
    return Object.fromEntries(packages.map(pkg => [pkg, '*']))
}

const externalPackages = async () => {
    let packages = {};
    let active = await ask({
            type: "confirm",
            message: "Would you like to add external packages",
        });
    while(active) {
        let package = await ask({
            type: "input",
            message: "Package Name",
        })
        if(package === '')
            break;
        try {
            let [pkg, ver] = await addPackage(package);
            packages[pkg] = ver;
        }
        catch(err) {
            
        }
        active = await ask({
            type: "confirm",
            message: "Add another external package",
        })
    }
    return packages;
}

const addPackage = async (search) => {
    return await new Promise((resolve, reject) => {
        exec(`composer show -all '*${search}*' 2>/dev/null`, async function(err, stdout) {
            let pkg = null;
            const packageList = stdout.split('\n').filter(n => n);
            
            if(!packageList.length) {
                console.error(packageList);
                reject();
            } else if(packageList.length == 1) {
                pkg = packageList[0];
            } else {
                pkg = await ask({
                    type: "list",
                    choices: packageList,
                    message: `Found ${packageList.length} packages matching ${search}`,
                })
            }
                
            const version = await resolveVersion(pkg.trim())
            
            resolve([pkg.trim(), version == '' ?  '*' : version]);
        });
    });
}

const ask = async (question) => {
    question.name ??= "prompt";
    let answer = await inquirer.prompt([question]);
    return answer[question.name];
};

const writeConfig = async () => {
    composerConfig = buildConfig();
    console.log(composerConfig);
    return await fs.writeFile(
        process.cwd() + '/composer.json',
        composerConfig,
        err => console.error(err)
    )
};

const buildConfig = () => {
    config.packages = Object.assign(config.basePackages, config.privatePackages, config.externalPackages);
    let composerConfig = '';
    try {
        composerConfig += fs.readFileSync(rootDir + '/resources/base.json', 'utf8');
    } catch (err) {
        console.error(err)
    }
    for(let [key, val] of Object.entries(config)) {
        val = val instanceof Object ? JSON.stringify(val, null, 2) : val;
        composerConfig = composerConfig.replaceAll(`<${key}>`, val);
    }
    
    return composerConfig;
};


const run = async () => {
    config.name = 'qisct/' + await askProjectName();
    config.description = await askProjectDescription();
    config.basePackages = await basePackages();
    config.privatePackages = await qisPackages();
    config.externalPackages = await externalPackages();
    await writeConfig();
};

run();
