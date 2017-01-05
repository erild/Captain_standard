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
    const projectId = data.repository.id;
    var projectsDirectory = process.env.PROJECTS_DIRECTORY;
    var project, folderName;
    var lintResults = [];
    callback();
    return new Promise((resolve, reject) => {
      Project.findById(projectId, {
        include: [{
          relation: 'linters',
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
    }).then(project => {
      return new Promise((resolve, reject) => {
        app.models.ProjectLinter.find({
          where: { projectId: project.id }
        }, (err, projectLinters) => {
          if (err) {
            reject(err);
          } else {
            resolve(projectLinters);
          }
        });
      });
    }).then((projectLinters) => {
      var linters = {};
      project.linters().forEach((linter) => {
        linters[linter.id] = linter;
      });

      var initCommands = [
        `cd ${projectsDirectory} && git clone ${project.cloneUrl} ${folderName} 2>&1`
      ];

      project.configCmd && project.configCmd
      .split("\n")
      .forEach((command) => {
        initCommands.push(`cd ${projectsDirectory}/${folderName} && ${command}`);
      });

      var promiseChain = Promise.resolve();
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
          return new Promise((resolve) => {
            exec(`cd ${projectsDirectory}/${folderName}${scan.directory} && ${linters[scan.linterId].runCmd} ${scan.arguments}`, (error, stdout, stderr) => {
              if (stdout) lintResults.push(stdout);
              resolve();
            });
          });
        });
      });
      promiseChain = promiseChain.then((results) => {console.log("results:", lintResults)});
      return promiseChain;
    }).catch((error) => console.log(error)
    ).then(() => {
      var cleanCommand = `cd ${projectsDirectory} && rm -rf ${folderName}`;
      async.until(() => {
        var projectCleaned = false;
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
    accepts: {arg: "data", type: "object", http: {source: 'body'}},
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

  Project.observe('after save', (ctx, next) => {
    if (ctx.instance && ctx.isNewInstance) {
      const baseUrl = app.get('url').replace(/\/$/, '')
      const webhookConf = {
        'name': 'web',
        'active': true,
        'events': ['pull_request'],
        'config': {'url': baseUrl + '/api/Projects/linters-exec', 'content_type': 'json'}
      };
      agent.post(`/repos/${ctx.instance.full_name}/hooks`, webhookConf);
    }
    next();
  });

  Project.observe('before delete', (ctx, next) => {
    if (ctx.where.hasOwnProperty('id')) {
      Project.findById(ctx.where.id, (err, project) => {
        if (!err) {
          if (project) {
            agent.get(`/repos/${project.full_name}/hooks`).then(res => {
              const hookUrl = app.get('url').replace(/\/$/, '') + '/api/Projects/linters-exec';
              res.forEach(hook => {
                if (hook.name === 'web' && hook.config.url === hookUrl) {
                  agent.delete(`/repos/${project.full_name}/hooks/${hook.id}`);
                }
              });
            });
          }
        }
        next();
      });
    }
  });
};
