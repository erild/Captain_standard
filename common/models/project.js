'use strict';

module.exports = function(Project) {

/**
 * Delete the project's Linter relations
 * @param {Function(Error, number)} callback
 */

Project.prototype.delProjectLinters = function(callback) {
  var count;
    Project.app.models.ProjectLinter.deleteAll().then(res => callback(null, res.count));
};

};
