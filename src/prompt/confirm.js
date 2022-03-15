'use strict';
/**
 * `boolean` type prompt
 */
import chalk from 'chalk';
import Confirm from 'inquirer/lib/prompts/confirm.js';

export default class ConfirmPrompt extends Confirm {
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
