const LoopBackContext = require('loopback-context');
module.exports = function (app) {
  return function setCurrentUser(req, res, next) {
    if (!req.accessToken) {
      return next();
    }
    app.models.Customer.findById(req.accessToken.userId, (err, user) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return next(new Error('No user with this access token was found.'));
      }
      const loopbackContext = LoopBackContext.getCurrentContext();
      if (loopbackContext) {
        loopbackContext.set('currentUser', user);
      }
      next();
    });
  };
};
