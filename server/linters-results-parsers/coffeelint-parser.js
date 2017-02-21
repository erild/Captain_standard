'use strict';
module.exports = function (stdout) {
  let results = [];
  stdout = JSON.parse(stdout);
  Object.keys(stdout).forEach(fileName => {
    const messages = stdout[fileName].map(message => (
      {
        message: `${message.message}. ${message.context}`,
        line: message.lineNumber,
        severity: message.value,
        ruleId: message.rule,

      }
    ));
    results.push({
      filePath: fileName,
      messages: messages,
    });
  });
  return results;
};
