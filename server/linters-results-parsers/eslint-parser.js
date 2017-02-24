'use strict';
module.exports = function (stdout, pathToProjectRoot) {
  let results = [];
  JSON.parse(stdout).forEach(file => {
    file.filePath = file.filePath
      .replace('\\', '/')
      .slice(pathToProjectRoot.length);
    results.push(file);
  });
  return results;
};
