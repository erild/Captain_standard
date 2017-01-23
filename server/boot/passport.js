'use strict';
// Make sure to also put this in `server/server.js`
const PassportConfigurator = require('loopback-component-passport-c')
  .PassportConfigurator;
const passport = require('passport');

module.exports = function (app) {
  // Include this in your 'facebook-oauth.js' boot script in `server/boot`.
  const passportConfigurator = new PassportConfigurator(app);

  passportConfigurator.init();
  passportConfigurator.setupModels({
    userModel: app.models.Customer,
    userIdentityModel: app.models.UserIdentity,
    userCredentialModel: app.models.UserCredential,
  });

  let config = require('../providers.js')['github'];
  config.customCallback = function (req, res, next) {
    passport.authenticate('github', {}, (err, user, info) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json('authentication error');
      }
      const successRedirect = function (req) {
        let url;
        if (!!req && req.session && req.session.returnTo) {
          const returnTo = req.session.returnTo;
          delete req.session.returnTo;
          url = returnTo;
        } else {
          url = config.successRedirect || '/';
        }
        return `${url}?access_token=${info.accessToken.id}&user_id=` +
          `${user.id.toString()}`;
      };
      return res.redirect(successRedirect(req));
    })(req, res, next);
  };
  passportConfigurator.configureProvider('github', config);
};
