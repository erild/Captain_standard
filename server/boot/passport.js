// Make sure to also put this in `server/server.js`
const PassportConfigurator = require('loopback-component-passport-c').PassportConfigurator;

module.exports = function(app) {

// Include this in your 'facebook-oauth.js' boot script in `server/boot`.
  const passportConfigurator = new PassportConfigurator(app);

  passportConfigurator.init();
  passportConfigurator.setupModels({
    userModel: app.models.Customer,
    userIdentityModel: app.models.UserIdentity,
    userCredentialModel: app.models.UserCredential
  });
  passportConfigurator.configureProvider('github', require('../providers.js')['github']);
}
