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
      const id = parseInt(ctx.req.params.id, 10);
      Project.app.models.ProjectInstallation
        .findOne({where: {projectId: id}})
        .then(projectInstallation => {
          if (!projectInstallation) {
            const error = new Error('Please check integration is installed for this repo.\n');
            error.statusCode = 400;
            return next(error);
          }
          return agent
            .get({
              url: `/repositories/${id}`,
              installationId: projectInstallation.installationId,
            })
            .then(res => {
              ctx.result = new Project();
              Object.assign(ctx.result, {
                id: res.id,
                fullName: res.full_name,
                cloneUrl: res.clone_url,
                fromGithub: true,
              });
              next();
            })
            .catch(err => {
              if (err.status === 404) {
                const error = new Error('Please check repo exists and you have write access.');
                error.statusCode = 404;
                next(error);
              } else {
                console.error(err);
                next(err);
              }
            });
        });
    } else {
      // eslint-disable-next-line camelcase
      ctx.result.fromGithub = false;
      next();
    }
  });

  ['upsert', 'findById', 'prototype.__link__customers', 'prototype.updateAllRel'].forEach(event =>
    Project.beforeRemote(event, (ctx, project, callback) => {
      Project.app.models.ProjectInstallation
        .findOne({where: {projectId: parseInt(ctx.req.params.id || ctx.req.body.id, 10)}})
        .then(projectInstallation => {
          if (!projectInstallation) {
            const error = new Error('Please check integration is installed for this repo.\n');
            error.statusCode = 400;
            return callback(error);
          }
          agent
            .get({
              url: `/repos/${projectInstallation.fullName}/collaborators`,
              installationId: projectInstallation.installationId,
            })
            .then(collaborators => {
              const collaborator = collaborators.filter(
                collaborator => collaborator.login === ctx.req.user.username);
              if (collaborator.length > 0 && collaborator[0].permissions.push) {
                callback();
              } else {
                const error = new Error('Please check you have write access to this repo');
                error.statusCode = 403;
                callback(error);
              }
            })
            .catch(err => callback(err));
        })
        .catch(err => callback(err));
    })
  );

  Project.observe('loaded', (ctx, callback) => {
    let data = ctx.instance || ctx.data;
    Project.app.models.ProjectInstallation
      .findOne({where: {projectId: parseInt(data.id, 10)}})
      .then(projectInstallation => {
        if (!projectInstallation) {
          const error = new Error(`Please check integration is installed for ${data.fullName}`);
          error.statusCode = 400;
          return callback(error);
        }
        data.installationId = projectInstallation.installationId;
        callback();
      }, err => callback(err));
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
    Project.app.models.ProjectLinter.find({
      fields: ['id'],
      where: {'projectId': this.id},
    })
      .then(projectLinters => {
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
          source: 'body',
        },
      },
    ],
    returns: [],
    description: 'Update all the linter relation of the project',
    http: [
      {
        path: '/updateAllRel',
        verb: 'post',
      },
    ],
  });

  Project.observe('before delete', (ctx, next) => {
    if (ctx.where.hasOwnProperty('id')) {
      Project.findById(ctx.where.id, (err, project) => {
        if (!err && project && !project.fromGithub) {
          agent.get({
            url: `/repos/${project.fullName}/hooks`,
            installationId: project.installationId,
          }).then(res => {
            const hookUrl = process.env.GITHUB_BACKEND_URL
                .replace(/\/$/, '') + '/api/Projects/linters-exec';
            res.forEach(hook => {
              if (hook.name === 'web' && hook.config.url === hookUrl) {
                agent.delete({
                  url: `/repos/${project.fullName}/hooks/${hook.id}`,
                  installationId: project.installationId,
                });
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

  const handleIntegrationEvent = (data) => {
    const installationId = data.installation && data.installation.id;
    const url = data.installation && data.installation.repositories_url;
    if (data.action === 'created') {
      getRepos(url, installationId);
    } else if (data.action === 'added' || data.action === 'removed') {
      data.repositories_removed.forEach(repo =>
        app.models.ProjectInstallation.destroyById(repo.id)
      );
      data.repositories_added.forEach(repo =>
        app.models.ProjectInstallation.upsert({
          projectId: repo.id,
          installationId,
          fullName: repo.full_name,
        })
      );
    } else if (data.action === 'deleted') {
      app.models.ProjectInstallation.destroyAll({installationId});
    }
    callback();
  };

  const handlePullRequestEvent = (data) => {
    if (!data.pull_request ||
      ['opened', 'reopened', 'edited'].indexOf(data.action) < 0) {
      return callback();
    }
    const projectId = data.repository.id;
    const projectsDirectory = process.env.PROJECTS_DIRECTORY;
    let project, folderName;
    let lintResults = [];
    let comments = [];
    let allLintPassed = true;
    Project.findById(projectId, {
      include: [
        {
          relation: 'linters',
        }, {
          relation: 'customers',
        }],
    }).then(result => {
      project = result;
      if (!project || project.fromGithub) {
        let error = new Error('Project is not configured');
        error.status = 404;
        callback(error);
        throw error;
      } else {
        callback();
        folderName = project.fullName.replace('/', '-') + Math.random();
        return project;
      }
    })
      .then(project => {
        agent.post({
          url: data.pull_request._links.statuses.href,
          raw: true,
          installationId: project.installationId,
          data: {state: 'pending', context: 'ci/captain-standard'},
        });
        return Promise.all([
          app.models.ProjectLinter.find({
            where: {projectId: project.id},
          }),
          agent.getToken({installationId: project.installationId}),
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
          `cd ${projectsDirectory} && git clone https://x-access-token:${token}@github.com/` +
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
                  const parser = require(linters[scan.linterId].pathToParser);
                  const parsedResults = parser(
                    stdout, `${projectsDirectory}/${folderName}/`);
                  lintResults.push(parsedResults);
                  resolve();
                }
              );
            });
          });
        });
        return promiseChain;
      })
      .then(() =>
        agent.get({
          installationId: project.installationId,
          url: data.pull_request.url,
          raw: true,
          headers: {'accept': 'application/vnd.github.v3.diff'},
          buffer: true,
        })
      )
      .then((diff) => {
        const filesChanged = parse(diff);
        // Flatten array of arrays
        lintResults = [].concat.apply([], lintResults);
        lintResults.forEach(file => {
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
              comments.push({
                body: commentBody,
                path: file.filePath,
                position: position,
                // eslint-disable-next-line camelcase
                commit_id: data.pull_request.head.sha,
              });
              allLintPassed = false;
            }
          });
        });

        return Promise.all([
          agent.post({
            url: data.pull_request._links.statuses.href,
            raw: true,
            installationId: project.installationId,
            data: {
              state: allLintPassed ? 'success' : 'failure',
              context: 'ci/captain-standard',
              description: 'Lint check',
            },
          }),
        ]);
      })
      .then(() => {
        comments.forEach(comment => {
          agent.post({
            installationId: project.installationId,
            url: data.pull_request.review_comments_url,
            data: comment,
            raw: true,
          });
        });
        const globalComment = allLintPassed ?
          'Yeah ! Well done ! :fireworks:\n' : 'Oh no, it failed :cry:\n';
        agent.post({
          installationId: project.installationId,
          url: data.pull_request.comments_url,
          data: {body: globalComment},
          raw: true,
        });

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
      })
      .catch(error => {
        if (project) {
          agent.post({
            url: data.pull_request._links.statuses.href,
            raw: true,
            installationId: project.installationId,
            data: {
              state: 'error',
              context: 'ci/captain-standard',
              description: error,
            },
          });
        }
        console.error(error);
      });
  };

  Project['integration-hook'] = (res, callback) => {
    const headers = res.headers;
    const data = res.body;
    const computed = new Buffer(`sha1=${
      crypto
        .createHmac('sha1', new Buffer(process.env.INTEGRATION_SECRET))
        .update(JSON.stringify(data))
        .digest('hex')
      }`);
    if (!headers['x-hub-signature'] ||
      !crypto.timingSafeEqual(computed, new Buffer(headers['x-hub-signature']))) {
      let error = new Error('Invalid secret');
      error.status = 401;
      return callback(error);
    }
    if (headers['x-github-event'].indexOf('integration_installation') > -1) {
      handleIntegrationEvent(data);
    } else if (headers['x-github-event'] === 'pull_request') {
      handlePullRequestEvent(data);
    }
  };

  function getRepos(url, installationId) {
    agent
      .get({
        url: url,
        raw: true,
        headers: {
          accept: 'application/vnd.github.machine-man-preview',
        },
        fullResponse: true,
        installationId,
      })
      .then(res => {
        let promises = [];
        res.body.repositories.forEach(repo =>
          promises.push(app.models.ProjectInstallation.upsert({
            projectId: repo.id,
            installationId,
            fullName: repo.full_name,
          }))
        );
        return Promise.all(promises).then(() => {
          const nextPage = /<([^>]+)>; rel="next"/.exec(res.header.link);
          if (nextPage) {
            return getRepos(nextPage[1], installationId);
          } else {
            return Promise.resolve('over');
          }
        });
      })
      .catch(err => {
        console.error(err);
      });
  }

  Project.remoteMethod('integration-hook', {
    description: 'Hook for Github integration',
    accepts: {
      arg: 'data',
      type: 'object',
      http: {
        source: 'req',
      },
      required: true,
    },
    http: {
      verb: 'post',
    },
  });
};
