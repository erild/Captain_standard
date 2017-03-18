'use strict';

module.exports = function (Script) {
  Script.observe('after delete', (ctx, next) => {
    if (!ctx.where.id) {
      return next();
    }
    Script.app.models
      .ProjectScript
      .destroyAll({scriptId: ctx.where.id})
      .then(() => next())
      .catch(err => next(err));
  });
};
