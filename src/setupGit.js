import prompt from "./prompt/index.js";
import path, { dirname } from "path";
import {existsSync, mkdirSync, writeFileSync, readFileSync} from "fs";
import { createOAuthDeviceAuth } from "@octokit/auth-oauth-device";
import { Octokit } from "@octokit/core";
import { fileURLToPath } from "url";
import { exec } from "child_process";
import { promisify } from 'util';
import open from 'open';
const execPromise = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = path.resolve(__dirname, "../");
const config = {};
let octokit;

const getAuth = async () => {
  config.token = false;
  try {
    let output = await execPromise(`git config user.token`);
    config.token = output.stdout.trim();
  } catch (e) {}
  if (!config.token) {
    const auth = createOAuthDeviceAuth({
      clientType: "oauth-app",
      clientId: "43f2953c0df1b4a9695e",
      clientSecret: "497fafc53d810e79553c53a106efebf5cfdd1b6a",
      scopes: ["admin:public_key", "repo", "read:org"],
      onVerification(verification) {

        try {
          open(verification.verification_uri);
        }
        catch (e) {}
        console.log("Open %s", verification.verification_uri);
        console.log("Enter code: %s", verification.user_code);
      },
    });
    config.token = (await auth({ type: "oauth" })).token;
    await execPromise(`git config --global user.token "${config.token}"`);
  }
  octokit = new Octokit({ auth: config.token });
};

const writeComposerAuth = () => {
  const dir = process.cwd() + "/.composer";
  if (!existsSync(dir)){
    mkdirSync(dir);
  }
  writeFileSync(dir + "/auth.json", buildComposerAuth(), (err) =>
    console.error(err)
  );
  prompt.outputSuccess("Github token written to .composer/auth.json");
};

const buildComposerAuth = () => {
  let file = "";
  try {
    file += readFileSync(rootDir + "/resources/auth.json", "utf8");
  } catch (err) {
    console.error(err);
  }
  for (let [key, val] of Object.entries(config)) {
    val = val instanceof Object ? JSON.stringify(val, null, 2) : val;
    file = file.replaceAll(`<${key}>`, val);
  }

  return file;
};

export default async function () {
  await getAuth();
  

  const {
    data: { id: userId, login: username, email },
  } = await octokit.request("GET /user");

  await writeComposerAuth();

  await execPromise(`composer i`);
}
