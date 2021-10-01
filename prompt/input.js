'use strict';
/**
 * `text` type prompt
 */
const chalk = require('chalk');
const Input = require('inquirer/lib/prompts/input');

class InputPrompt extends Input {
  constructor(question, rl, answers) {
    question.prefix ??= '';
    question.suffix ??= ':';
    question.primary ??= 'yellow';
    super(question, rl, answers);
  }
  
  render(error) {
    let bottomContent = '';
    let appendContent = '';
    let message = this.getQuestion();
    const { transformer } = this.opt;
    const isFinal = this.status === 'answered';

    if (isFinal) {
      appendContent = this.answer;
    } else {
      appendContent = this.rl.line;
    }

    if (transformer) {
      message += transformer(appendContent, this.answers, { isFinal });
    } else {
      message += isFinal ? chalk.yellow(appendContent) : appendContent;
    }

    if (error) {
      bottomContent = chalk.red('>> ') + error;
    }

    this.screen.render(message, bottomContent);
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

module.exports = InputPrompt;
