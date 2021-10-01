'use strict';
/**
 * `text` type prompt
 */
const chalk = require('chalk');
const Confirm = require('inquirer/lib/prompts/confirm');

class ConfirmPrompt extends Confirm {
  constructor(question, rl, answers) {
    question.prefix ??= '';
    question.suffix ??= ':';
    question.primary ??= 'yellow';
    super(question, rl, answers);
  }
  
  render(answer) {
    let message = this.getQuestion();

    if (typeof answer === 'boolean') {
      message += chalk[this.opt.primary](answer ? 'Yes' : 'No');
    } else {
      message += this.rl.line;
    }

    this.screen.render(message);

    return this;
  }
  
  getQuestion() {
    let message =
      (this.opt.prefix ? this.opt.prefix + ' ' : '') +
      this.opt.message;

    // Append the default if available, and if question isn't touched/answered
    if (
      this.opt.default != null &&
      this.status !== 'touched' &&
      this.status !== 'answered'
    ) {
     message += ' [' + chalk[this.opt.primary](this.opt.default) + ']';
    }
    
    // Add suffix and reset
    message += this.opt.suffix + chalk.reset(' ');

    return message;
  }
}

module.exports = ConfirmPrompt;
