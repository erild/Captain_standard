'use strict';

module.exports = function (Projectlinter) {
  Projectlinter.beforeRemote('find', (ctx, project, callback) =>
    Projectlinter.app.models.ProjectInstallation
      .findOne({where: {projectId: parseInt(ctx.args.filter.where.id, 10)}})
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
      .catch(err => callback(err))
  );
};
