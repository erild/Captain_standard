'use strict';
require('dotenv').config({silent: true});
const Raven = require('raven');
const loopback = require('loopback');
const boot = require('loopback-boot');
const LoopBackContext = require('loopback-context');

const app = module.exports = loopback();
//eslint-disable-next-line no-unused-expressions
require('loopback-component-passport-c').PassportConfigurator;

if (process.env.NODE_ENV === 'production' || process.env.USE_SENTRY === 'true') {
  Raven.config(process.env.DSN).install();
  app.use(Raven.requestHandler());
}

app.start = function () {
  // start the web server
  return app.listen(() => {
    app.emit('started');
    const baseUrl = app.get('url').replace(/\/$/, '');
    console.log('Web server listening at: %s', baseUrl);
    if (app.get('loopback-component-explorer')) {
      const explorerPath = app.get('loopback-component-explorer').mountPath;
      console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
    }
  });
};

app.use('/auth/github', (req, res, next) => {
  req.session.returnTo = req.query.returnTo || req.session.returnTo;
  next();
});

//Set current user
app.use((req, res, next) => {
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
    let loopbackContext = LoopBackContext.getCurrentContext();
    if (loopbackContext) {
      loopbackContext.set('currentUser', user);
    }
    next();
  });
});

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, (err) => {
  if (err) {
    throw err;
  }

  // start the server if `$ node server.js`
  if (require.main === module) {
    app.start();
  }
});

if (process.env.NODE_ENV === 'production' || process.env.USE_SENTRY === 'true') {
  app.get('remoting').errorHandler = {
    handler: Raven.errorHandler(),
  };
}
