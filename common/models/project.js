'use strict';
const util = require('util');
const exec = require('child_process').exec;
const async = require('async');
const fs = require('fs');
const crypto = require('crypto');
const process = require('process');
const parse = require('parse-diff');
const app = require('../../server/server');
const agent = require('../../server/agent');
const _ = require('lodash');

module.exports = function (Project) {
  Project.afterRemote('findById', (ctx, output, next) => {
    if (!output) {
      agent
        .get({url: `/repositories/${ctx.req.params.id}`})
        .then(res => {
          ctx.result = new Project();
          Object.assign(ctx.result, {
            id: res.id,
            fullName: res.full_name,
            cloneUrl: res.clone_url,
            fromGithub: true,
          });
          next();
        }, err => next());
    } else {
      // eslint-disable-next-line camelcase
      ctx.result.fromGithub = false;
      next();
    }
  });

  Project['linters-exec'] = (req, callback) => {
    let data = req.body;
    let headers = req.headers;

    if (!data.pull_request ||
      ['opened', 'reopened', 'edited'].indexOf(data.action) < 0) {
      return callback();
    }
    const projectId = data.repository.id;
    const projectsDirectory = process.env.PROJECTS_DIRECTORY;
    let project, folderName;
    let lintResults = [];
    new Promise((resolve, reject) => {
      Project.findById(projectId, {
        include: [
          {
            relation: 'linters',
          }, {
            relation: 'customers',
          }],
      }, (err, result) => {
        if (err) {
          reject(err);
        } else {
          project = result;
          if (!project) {
            let error = new Error('Project is not configured');
            error.status = 404;
            reject(error);
            return callback(error);
          }
          if (project.webhookSecret === '') {
            let error = new Error('Please add a secret and save it to Captain Standard');
            error.status = 401;
            callback(error);
            reject(error);
          } else {
            const computed = new Buffer(`sha1=${
              crypto
              .createHmac('sha1', project.webhookSecret)
              .update(JSON.stringify(data))
              .digest('hex')
            }`);
            const received = new Buffer(headers['x-hub-signature']);
            if (!crypto.timingSafeEqual(computed, received)) {
              let error = new Error('Invalid secret');
              error.status = 401;
              callback(error);
              reject(error);
            } else {
              callback();
              folderName = project.fullName.replace('/', '-') + Math.random();
              resolve(project);
            }
          }
        }
      });
    })
    .then(project => {
      agent.post({
        url: data.pull_request._links.statuses.href,
        raw: true,
        user: project.customers()[0],
        data: {state: 'pending', context: 'ci/captain-standard'},
      });
      return Promise.all([
        new Promise((resolve, reject) => {
          app.models.ProjectLinter.find({
            where: {projectId: project.id},
          }, (err, projectLinters) => {
            if (err) {
              reject(err);
            } else {
              resolve(projectLinters);
            }
          });
        }),
        agent.getToken({user: project.customers()[0]}),
      ]);
    })
    .then((results) => {
      const projectLinters = results[0];
      const token = results[1];
      let linters = {};
      project.linters().forEach((linter) => {
        linters[linter.id] = linter;
      });

      let initCommands = [
        `cd ${projectsDirectory} && git clone https://${token}@github.com/` +
        `${data.repository.full_name}.git ${folderName} && cd ` +
        `${projectsDirectory}/${folderName} && git checkout ` +
        `${data.pull_request.head.sha} 2>&1`,
      ];

      if (project.configCmd) {
        project.configCmd
          .split('\n')
          .forEach((command) => {
            initCommands.push(
              `cd ${projectsDirectory}/${folderName} && ${command}`);
          });
      }
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
            exec(
              `cd ${projectsDirectory}/${folderName}${scan.directory} && ` +
              `${linters[scan.linterId].runCmd} ${scan.arguments}`,
              (error, stdout, stderr) => {
                if (stderr) {
                  return reject(stderr);
                }
                lintResults.push(stdout);
                resolve();
              }
            );
          });
        });
      });
      return promiseChain;
    })
    .then(() => agent.get({
      user: project.customers()[0],
      url: data.pull_request.url,
      raw: true,
      headers: {'accept': 'application/vnd.github.v3.diff'},
      buffer: true,
    })
    )
    .then((diff) => {
      const filesChanged = parse(diff);
      // Flatten array of arrays
      lintResults = JSON.parse([].concat.apply([], lintResults));
      let comments = [];
      let allLintPassed = true;
      lintResults.forEach(file => {
        file.filePath = file.filePath
          .replace('\\', '/')
          .slice(`${projectsDirectory}/${folderName}/`.length);
        file.messages.forEach(message => {
          const fileDiff = _.find(filesChanged, {to: file.filePath});
          if (!fileDiff) {
            // file concerned with the message not in the diff => we do not comment
            return;
          }
          const chunkIndex = _.findIndex(
            fileDiff.chunks,
            o => message.line >= o.newStart && message.line <= (o.newStart + o.newLines)
          );
          if (fileDiff && chunkIndex > -1) {
            const chunk = fileDiff.chunks[chunkIndex];
            // position in current chunk
            let position = 1 + _.findIndex(chunk.changes, {
              ln: message.line,
              add: true,
            });
            if (position === 0) {
              // line concerned with the message not in the diff => we do not comment
              return;
            }
            // position in the diff if current chunk is not the first
            if (chunkIndex > 0) {
              let count = 0;
              for (let i = 0; i < chunkIndex; i++) {
                count += fileDiff.chunks[i].changes.length + 1;
              }
              position += count;
            }
            const commentBody = `${message.severity === 2 ? '(Error)' : '(Warning)'} Line ${message.line}: ${message.message} - ${message.ruleId}`;
            comments.push({body: commentBody, path: file.filePath, position: position});
            allLintPassed = false;
          }
        });
      });

      let body = allLintPassed ? 'Yeah ! Well done ! :fireworks:\n' :
        'Oh no, it failed :cry:\n';
      agent.post({
        url: data.pull_request._links.statuses.href,
        raw: true,
        user: project.customers()[0],
        data: {
          state: allLintPassed ? 'success' : 'failure',
          context: 'ci/captain-standard',
        },
      });
      return agent.post({
        installationId: project.installationId,
        url: `${data.pull_request.url}/reviews`,
        data: {
          body: body,
          event: allLintPassed ? 'APPROVE' : 'REQUEST_CHANGES',
          comments: comments,
        },
        raw: true,
      });
    })
    .catch((error) => {
      agent.post({
        url: data.pull_request._links.statuses.href,
        raw: true,
        user: project.customers()[0],
        data: {
          state: 'error',
          context: 'ci/captain-standard',
        },
      });
    })
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
    accepts: {
      arg: 'req',
      type: 'object',
      http: {
        source: 'req',
      },
      required: true,
    },
    http: {
      verb: 'post',
    },
    returns: null,
  });

  /**
   * Update all the linter relation of the project
   * @param {Array} listRel array of all the linter relation
   * @param {function(Error)} callback
   */
  Project.prototype.updateAllRel = function (listRel, callback) {
    listRel.forEach(rel => {
      if (rel.hasOwnProperty('projectId') == false ||
        rel.hasOwnProperty('linterId') == false ||
        rel.hasOwnProperty('directory') == false ||
        rel.hasOwnProperty('arguments') == false) {
        callback(new Error('Invalid projectLinter parameters'));
        next();
      }
    });
    new Promise((resolve, reject) => {
      Project.app.models.ProjectLinter.find({
        fields: ['id'],
        where: {'projectId': this.id},
      }, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    }).then(projectLinters => {
      projectLinters.forEach(projectLinter => {
        if (listRel.find(rel => rel.id === projectLinter.id) === undefined) {
          Project.app.models.ProjectLinter.destroyById(projectLinter.id);
        }
      });
      listRel.forEach(rel => {
        Project.app.models.ProjectLinter.upsert(rel);
      });
      callback();
    });
  };

  Project.remoteMethod('updateAllRel', {
    isStatic: false,
    accepts: [
      {
        arg: 'listRel',
        type: 'array',
        required: true,
        description: 'array of all the linter relation',
        http: {
          source: 'body'
        }
      }
    ],
    returns: [],
    description: 'Update all the linter relation of the project',
    http: [
      {
        path: '/updateAllRel',
        verb: 'post'
      }
    ]
  });

  Project.observe('after save', (ctx, next) => {
    if (ctx.instance && ctx.isNewInstance) {
      const baseUrl = process.env.GITHUB_BACKEND_URL.replace(/\/$/, '');
      const secret = crypto.randomBytes(16).toString('hex');
      const webhookConf = {
        'name': 'web',
        'active': true,
        'events': ['pull_request'],
        'config': {
          'url': baseUrl + '/api/Projects/linters-exec',
          'content_type': 'json',
          'secret': secret,
        },
      };
      agent.post({
        url: `/repos/${ctx.instance.fullName}/hooks`,
        data: webhookConf,
      })
      .then(res => {
        ctx.instance.webhookSecret = secret;
        Project.upsert(ctx.instance);
        next();
      })
      .catch(err => {
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
          agent.get({url: `/repos/${project.fullName}/hooks`}).then(res => {
            const hookUrl = process.env.GITHUB_BACKEND_URL
                .replace(/\/$/, '') + '/api/Projects/linters-exec';
            res.forEach(hook => {
              if (hook.name === 'web' && hook.config.url === hookUrl) {
                agent.delete(
                  {url: `/repos/${project.fullName}/hooks/${hook.id}`}
                );
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

  Project['integration-hook'] = (data, callback) => {
    if (data.action === 'created') {
      const installationId = data.installation.id;
      const url = data.installation.repositories_url;
      getRepos(url, installationId);
    }
    callback();
  };

  function getRepos(url, installationId) {
    agent
      .get({
        url: url,
        raw: true,
        headers: {
          accept: 'application/vnd.github.machine-man-preview'
        },
        fullResponse: true,
        installationId,
      })
      .then(res => {
        let promises = [];
        res.body.repositories.forEach(repo =>
          promises.push(new Promise((resolve, reject) =>
            Project.findById(repo.id, (err, foundRepo) => {
              if (!err && foundRepo) {
                foundRepo.updateAttribute('installationId', installationId, resolve);
              } else {
                resolve();
              }
            })
          ))
        );
        return Promise.all(promises).then(() => {
          const nextPage = /<([^>]+)>; rel="next"/.exec(res.header.link);
          if (nextPage) {
             return getRepos(nextPage[1], installationId);
          } else {
            return Promise.resolve('over');
          }
        });
      });
  }

  Project.remoteMethod('integration-hook', {
    description: 'Hook for Github integration',
    accepts: {
      arg: 'data',
      type: 'object',
      http: {
        source: 'body',
      },
      required: true,
    },
    http: {
      verb: 'post',
    },
    returns: null,
  });
};
