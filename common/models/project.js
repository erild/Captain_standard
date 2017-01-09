'use strict';
const util = require('util');
const exec = require('child_process').exec;
const async = require('async');
const fs = require('fs');
const process = require('process');

const app = require('../../server/server');
const agent = require('../../server/agent');

module.exports = function (Project) {

  Project["linters-exec"] = (data, callback) => {
    if (!data.pull_request || ['opened', 'reopened', 'edited'].indexOf(data.action) < 0) {
      return callback();
    }
    const projectId = data.repository.id;
    const projectsDirectory = process.env.PROJECTS_DIRECTORY;
    let project, folderName;
    let lintResults = [];
    callback();
    new Promise((resolve, reject) => {
      Project.findById(projectId, {
        include: [
          {
            relation: 'linters'
          }, {
            relation: 'customers'
          }]
      }, (err, result) => {
        if (err) {
          reject(err);
        } else {
          project = result;
          folderName = project.full_name.replace('/', '-') + Math.random()
          resolve(project);
        }
      });
    })
    .then(project => {
      return Promise.all([
        new Promise((resolve, reject) => {
          app.models.ProjectLinter.find({
            where: {projectId: project.id}
          }, (err, projectLinters) => {
            if (err) {
              reject(err);
            } else {
              resolve(projectLinters);
            }
          });
        }),
        agent.getToken(project.customers()[0])
      ])
    })
    .then((results) => {
      const projectLinters = results[0];
      const token = results[1];
      let linters = {};
      project.linters().forEach((linter) => {
        linters[linter.id] = linter;
      });

      let initCommands = [
        `cd ${projectsDirectory} && git clone https://${token}@github.com/${data.repository.full_name}.git ${folderName} && cd ${projectsDirectory}/${folderName} && git checkout ${data.pull_request.head.sha} 2>&1`
      ];

      project.configCmd && project.configCmd
      .split("\n")
      .forEach((command) => {
        initCommands.push(`cd ${projectsDirectory}/${folderName} && ${command}`);
      });

      let promiseChain = Promise.resolve();
      initCommands.forEach(cmd => {
        promiseChain = promiseChain.then(() => {
          return new Promise((resolve, reject) => {
            exec(cmd, (error, stdout, stderr) => {
              if (error) {
                reject(error + stderr);
              } else {
                resolve();
              }
            });
          });
        });
      });

      projectLinters.forEach((scan) => {
        promiseChain = promiseChain.then(() => {
          return new Promise((resolve, reject) => {
            exec(`cd ${projectsDirectory}/${folderName}${scan.directory} && ${linters[scan.linterId].runCmd} ${scan.arguments}`, (error, stdout, stderr) => {
              if (stderr) {
                return reject(stderr);
              }
              lintResults.push(stdout);
              resolve();
            });
          });
        });
      });
      return promiseChain;
    })
    .then(() => {
      return agent.get({user: project.customers()[0], url: data.pull_request.diff_url, raw: true})
    })
    .then((diff) => {
      const regex = /\+\+\+ b\/(.+)\n@@ -\d+,?\d* \+(\d+),?(\d*) @@/g;
      let filesChanged = [];
      let matched;
      while ((matched = regex.exec(diff)) !== null) {
        let linesChanged = Number.parseInt(matched[3]) || 1;
        filesChanged[matched[1]] = [];
        for (let i = 0; i < linesChanged; i++) {
          filesChanged[matched[1]].push(Number.parseInt(matched[2]) + i);
        }
      }
      return filesChanged
    })
    .then((filesChanged) => {
      // Flatten array of arrays
      lintResults = JSON.parse([].concat.apply([], lintResults));

      let comments = [];
      let allLintPassed = true;
      lintResults.forEach(file => {
        file.filePath = file.filePath.replace('\\', '/').slice(`${projectsDirectory}/${folderName}/`.length);
        file.messages.forEach(message => {
          if (file.filePath in filesChanged && filesChanged[file.filePath].indexOf(message.line) > -1) {
            let commentBody = `${message.severity === 2 ? "(Error)" : "(Warning)"} Line ${message.line}: ${message.message} - ${message.ruleId}`;
            comments.push({body: commentBody, path: file.filePath, position: message.line});
            allLintPassed = false;
          }
        });
      });

      let body = allLintPassed ? 'Yeah ! Well done ! :fireworks:\n' : 'Oh no, it failed :cry:\n';
      agent.post({user: project.customers()[0], url: `${data.pull_request.url}/reviews`, data: {body: body, event: allLintPassed ? "APPROVE" : "REQUEST_CHANGES", comments: comments}, raw: true});
    })
    .catch((error) => console.log(error))
    .then(() => {
      const cleanCommand = `cd ${projectsDirectory} && rm -rf ${folderName}`;
      async.until(() => {
        let projectCleaned = false;
        try {
          fs.accessSync(`${projectsDirectory}/${folderName}`, fs.F_OK);
        } catch (e) {
          projectCleaned = true;
        }
        return projectCleaned;
      }, () => exec(cleanCommand));
    });
  };

  Project.remoteMethod('linters-exec', {
    description: 'Execute linters on this project.',
    accepts: {arg: "data", type: "object", http: {source: 'body'}, required: true},
    http: {
      verb: 'post'
    },
    returns: null
  });

  /**
   * Update all the linter relation of the project
   * @param {array} listRel array of all the linter relation
   * @param {Function(Error)} callback
   */

  Project.prototype.updateAllRel = function(listRel, callback) {
    listRel.forEach(rel => {
      if(rel.hasOwnProperty('projectId') == false ||
        rel.hasOwnProperty('linterId') == false ||
        rel.hasOwnProperty('directory') == false ||
        rel.hasOwnProperty('arguments') == false) {
        callback(new Error("Invalid projectLinter parameters"));
        next();
      }
    });
    new Promise((resolve, reject) => {
      Project.app.models.ProjectLinter.find({
          fields:['id'],
          where: {'projectId': this.id}
        }, (err, result) => {
        if (err) {
          reject(err);
        } else {
          let projectLinters = result;
          resolve(projectLinters);
        }
      });
    }).then(projectLinters => {
      projectLinters.forEach(projectLinter => {
          if(listRel.find(rel => rel.id === projectLinter.id) === undefined) {
            Project.app.models.ProjectLinter.destroyById(projectLinter.id);
          }
      });
      listRel.forEach(rel => {
        Project.app.models.ProjectLinter.upsert(rel)
      });
      callback();
    })
  };

};
