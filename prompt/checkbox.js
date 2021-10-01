'use strict';
/**
 * `text` type prompt
 */
const _ = {
  assign: require('lodash/assign'),
  defaults: require('lodash/defaults'),
  clone: require('lodash/clone'),
};
const chalk = require('chalk');
const Checkbox = require('inquirer/lib/prompts/checkbox');

class CheckboxPrompt extends Checkbox {
  constructor(question, rl, answers) {
    question.prefix ??= '';
    question.suffix ??= ':';
    question.primary ??= 'yellow';
    super(question, rl, answers);
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

module.exports = CheckboxPrompt;
