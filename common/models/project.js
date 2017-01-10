'use strict';
const util = require('util');
const exec = require('child_process').exec;
const async = require('async');
const fs = require('fs');
const crypto = require('crypto');
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
      const customers = project.customers();
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
          return new Promise((resolve) => {
            exec(`cd ${projectsDirectory}/${folderName}${scan.directory} && ${linters[scan.linterId].runCmd} ${scan.arguments}`, (error, stdout, stderr) => {
              if (stderr) {
                return reject(stderr);
              }
              let result;
              if (error) {
                result = 'Oh no, it failed :cry:\n' + stdout;
              } else {
                result = 'Yeah ! Well done ! :fireworks:\n';
              }
              lintResults.push(result);
              resolve();
            });
          });
        });
      });
      promiseChain = promiseChain.then(() => {
        console.log(lintResults);
        agent.post({user: customers[0], url: `${data.pull_request.comments_url}`, data: {body: lintResults.join('\n')},raw: true});
      });
      return promiseChain;
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

  Project.observe('after save', (ctx, next) => {
    if (ctx.instance && ctx.isNewInstance) {
      const baseUrl = process.env.GITHUB_BACKEND_URL.replace(/\/$/, '')
      const secret =  crypto.randomBytes(16).toString('hex');
      const webhookConf = {
        'name': 'web',
        'active': true,
        'events': ['pull_request'],
        'config': {
          'url': baseUrl + '/api/Projects/linters-exec',
          'content_type': 'json',
          'secret': secret
        }
      };
      agent.post({url: `/repos/${ctx.instance.full_name}/hooks`,data: webhookConf}).then(res => {
        ctx.instance.webhook_secret = secret;
        Project.upsert(ctx.instance);
        next();
      }).catch(err => {
        next();
      });
    } else {
      next();
    }
  });

  Project.observe('before delete', (ctx, next) => {
    if (ctx.where.hasOwnProperty('id')) {
      Project.findById(ctx.where.id, (err, project) => {
        if (!err && project) {
            agent.get({url: `/repos/${project.full_name}/hooks`}).then(res => {
              const hookUrl = process.env.GITHUB_BACKEND_URL.replace(/\/$/, '') + '/api/Projects/linters-exec';
              res.forEach(hook => {
                if (hook.name === 'web' && hook.config.url === hookUrl) {
                  agent.delete({url: `/repos/${project.full_name}/hooks/${hook.id}`});
                }
              });
              next();
            });
        } else {
          next();
        }
      });
    } else {
      next();
    }
  });
};
