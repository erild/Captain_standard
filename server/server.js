'use strict';
require('cls-hooked');
require('dotenv').config({silent: true});
var Raven = require('raven');
var loopback = require('loopback');
var boot = require('loopback-boot');
var LoopBackContext = require('loopback-context');

var app = module.exports = loopback();
require('loopback-component-passport-c').PassportConfigurator;

if (process.env.NODE_ENV === 'production' || process.env.USE_SENTRY === 'true') {
  Raven.config(process.env.DSN).install({
    captureUnhandledRejections: true
  });
  app.use(Raven.requestHandler());
}

app.start = function() {
  // start the web server
  return app.listen(function() {
    app.emit('started');
    var baseUrl = app.get('url').replace(/\/$/, '');
    console.log('Web server listening at: %s', baseUrl);
    if (app.get('loopback-component-explorer')) {
      var explorerPath = app.get('loopback-component-explorer').mountPath;
      console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
    }
  });
};


app.use('/auth/github', (req, res, next) => {
  req.session.returnTo = req.query.returnTo || req.session.returnTo;
  next();
});



// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, function(err) {
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
    handler: Raven.errorHandler()
  };
  process.on('unhandledRejection', function (reason) {
    Raven.captureException(reason);
  });
}
