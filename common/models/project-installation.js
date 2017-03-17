'use strict';
const agent = require('../../server/agent');

module.exports = function (ProjectInstallation) {
  ProjectInstallation.beforeRemote('find', (ctx, project, callback) => {
    if (ctx.req.checkingPerms) {
      return callback();
    }
    ctx.req.checkingPerms = true;
    ProjectInstallation
      .findOne({where: {fullName: ctx.args.filter.where.fullName}})
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
  });

  ProjectInstallation.observe('after delete', (ctx, next) => {
    if (!ctx.where.projectId) {
      return next();
    }
    ProjectInstallation.app.models
      .Project
      .destroyById(ctx.where.projectId)
      .then(() => next())
      .catch(err => next(err));
  });
};
