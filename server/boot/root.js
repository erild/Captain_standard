'use strict';

module.exports = function (server) {
  // Install a `/` route that returns server status
  let router = server.loopback.Router();
  if (process.env.NODE_ENV !== 'production') {
    router.get('/', server.loopback.status());
  }
  server.use(router);
};
