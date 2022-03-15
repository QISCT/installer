import inquirer from "inquirer";
import chalk from "chalk";
import input from "./input.js";
import checkbox from "./checkbox.js";
import confirm from "./confirm.js";

inquirer.registerPrompt("input", input);
inquirer.registerPrompt("checkbox", checkbox);
inquirer.registerPrompt("confirm", confirm);

const ask = async (question) => {
  question.name ??= "prompt";
  let answer = await inquirer.prompt([question]);
  return answer[question.name];
};

const strWrap = (str, val) => {
  return val + str + val;
};

const strPad = (str, extra = false) => {
  str = strWrap(str.trim(), "  ");
  const length = str.length;
  str = strWrap(str, "\n");
  str = strWrap(str, " ".repeat(length));
  if (extra) {
    str = strWrap(str, "\n");
  }
  return str;
};

const outputSuccess = (msg, extra = true) => {
  console.log(chalk.black(chalk.bgGreen(strPad(msg, extra))));
};

const outputDanger = (msg, extra = false) => {
  console.log(chalk.white(chalk.bgRed(strPad(msg, extra))));
};

export default {
  ask,
  strWrap,
  strPad,
  outputSuccess,
  outputDanger,
  inquirer,
};
