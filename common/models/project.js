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

  [
    'upsert',
    'findById',
    'prototype.__link__customers',
    'prototype.updateAllRel',
    'deleteById',
  ].forEach(event =>
    Project.beforeRemote(event, (ctx, project, callback) => {
      if (ctx.req.checkingPerms) {
        return callback();
      }
      ctx.req.checkingPerms = true;
      Project.app.models.ProjectInstallation
        .findOne({where: {projectId: parseInt(ctx.req.params.id || ctx.req.body.id, 10)}})
        .then(projectInstallation => {
          if (!projectInstallation) {
            if (ctx.method.name.indexOf('delete') > -1) {
              // We allow deletion of an orphan project
              return callback();
            }
            const error = new Error('Please check integration is installed for this repo.\n');
            error.statusCode = 400;
            return callback(error);
          }
          if (projectInstallation && !projectInstallation.fullName) {
            const error = new Error('Repos data is outdated. Please reinstall the integration.');
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

  /**
   * Update all the linter relation of the project
   * @param {Array} listLinterRel array of all the linter relation
   * @param {Array} listScriptRel array of all the scripts relation
   * @param {function(Error)} callback
   */
  Project.prototype.updateAllRel = function (listLinterRel, listScriptRel, callback) {
    listLinterRel.forEach(rel => {
      if (rel.hasOwnProperty('projectId') == false ||
        rel.hasOwnProperty('linterId') == false ||
        rel.hasOwnProperty('directory') == false) {
        callback(new Error('Invalid projectLinter relation parameters'));
        next();
      }
    });
    listScriptRel.forEach(rel => {
      if (rel.hasOwnProperty('projectId') == false ||
        rel.hasOwnProperty('scriptId') == false ||
        rel.hasOwnProperty('directory') == false) {
        callback(new Error('Invalid projectScript relation  parameters'));
        next();
      }
    });
    Promise
      .all([
        Project.app.models.ProjectLinter.find({
          fields: ['id'],
          where: {'projectId': this.id},
        }),
        Project.app.models.ProjectScript.find({
          fields: ['id'],
          where: {'projectId': this.id},
        }),
      ])
      .then(res => {
        let projectLinters = res[0];
        let projectScripts = res[1];

        projectLinters.forEach(projectLinter => {
          if (listLinterRel.find(rel => rel.id === projectLinter.id) === undefined) {
            Project.app.models.ProjectLinter.destroyById(projectLinter.id);
          }
        });
        listLinterRel.forEach(rel => {
          Project.app.models.ProjectLinter.upsert(rel);
        });
        projectScripts.forEach(projectScript => {
          if (listScriptRel.find(rel => rel.id === projectScript.id) === undefined) {
            Project.app.models.ProjectScript.destroyById(projectScript.id);
          }
        });
        listScriptRel.forEach(rel => {
          Project.app.models.ProjectScript.upsert(rel);
        });
        callback();
      });
  };

  Project.remoteMethod('updateAllRel', {
    isStatic: false,
    accepts: [
      {
        arg: 'listLinterRel',
        type: 'array',
        required: true,
        description: 'array of all the linter relation',
      },
      {
        arg: 'listScriptRel',
        type: 'array',
        required: true,
        description: 'array of all the script relation',
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

  const handleIntegrationEvent = (data, callback) => {
    const installationId = data.installation && data.installation.id;
    const url = data.installation && data.installation.repositories_url;
    if (data.action === 'created') {
      getRepos(url, installationId);
    } else if (data.action === 'added' || data.action === 'removed') {
      data.repositories_removed.forEach(repo =>
        repo && app.models.ProjectInstallation.destroyById(repo.id)
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

  const handlePullRequestEvent = (data, callback) => {
    if (!data.pull_request ||
      ['opened', 'reopened', 'edited'].indexOf(data.action) < 0) {
      return callback();
    }
    const projectId = data.repository.id;
    const projectsDirectory = process.env.PROJECTS_DIRECTORY;
    let project, folderName;
    let lintResults = [];
    let comments = [];
    let globalScriptComments = [];
    let allLintPassed = true;
    let scriptResults = [];
    Promise.all([
      Project.findById(projectId, {
        include: [
          {
            relation: 'linters',
          }, {
            relation: 'customers',
          }, {
            relation: 'scripts',
          }],
      }),
      Project.app.models.ProjectInstallation
        .findOne({where: {projectId}}),
    ]).then(result => {
      project = result[0];
      if (!result[1]) {
        const error = new Error(`Please check integration is installed for ${data.fullName}`);
        error.statusCode = 400;
        throw error;
      }
      project.installationId = result[1].installationId;
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
          app.models.ProjectScript.find({
            where: {projectId: project.id},
          }),
        ]);
      })
      .then((results) => {
        const projectLinters = results[0];
        const token = results[1];
        const projectScripts = results[2];
        let linters = {};
        project.linters().forEach((linter) => {
          linters[linter.id] = linter;
        });
        let scripts = {};
        project.scripts().forEach((script) => {
          scripts[script.id] = script;
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
        projectScripts.forEach((scan) => {
          promiseChain = promiseChain.then(() =>
            new Promise((resolve, reject) => {
              try {
                let scriptFunction = new Function('require', 'dir', `'use strict';${scripts[scan.scriptId].content}`);
                let output = scriptFunction(require, `${projectsDirectory}/${folderName}${scan.directory}`);
                const parser = require('../../server/linters-results-parsers/custom-script-parser');
                const parsedResults = parser(output.fileComments, `${projectsDirectory}/${folderName}/`);
                lintResults.push(parsedResults);
                scriptResults.push.apply(scriptResults, output.globalComments);
                resolve();
              } catch (err) {
                return reject(`${err.name}: ${err.message}`);
              }
            })
          );
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
        scriptResults.forEach(message => {
          const commentBody = `${message.severity === 2 ? '(Error)' : '(Warning)'}: ${message.message}`;
          globalScriptComments.push({body: commentBody});
          allLintPassed = false;
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
        globalScriptComments.forEach(comment => {
          agent.post({
            installationId: project.installationId,
            url: data.pull_request.comments_url,
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
      handleIntegrationEvent(data, callback);
    } else if (headers['x-github-event'] === 'pull_request') {
      handlePullRequestEvent(data, callback);
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
