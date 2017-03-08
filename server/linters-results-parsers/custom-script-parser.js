'use strict';
module.exports = function (output, pathToProjectRoot) {
  let results = [];
  output.forEach(file => {
    file.filePath = file.filePath
      .replace('\\', '/')
      .slice(pathToProjectRoot.length);
    results.push(file);
  });
  return results;
};
