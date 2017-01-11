const agent = require('../../server/agent');

module.exports = function (Customer) {
  Customer.observe('before save', (context, callback) => {
    if (context.instance && context.instance.__data) {
      const regexResult = /^github\.(.*)/.exec(context.instance.__data.username);
      if (regexResult) {
        context.instance.__data.username = /^github\.(.*)/.exec(context.instance.__data.username)[1];
      }
    }
    callback();
  });

  Customer.prototype.repos = (callback) => {
    const createPromise = repo => {
      return new Promise((resolve) => {
        Customer.app.models.Project
          .findOne({where: {id: repo.id}})
          .then(exists => {
            if (exists) {
              repo.configured = true;
            }
            resolve(repo);
          })
      });
    }

    agent
      .get({url: '/user/repos'})
      .then(res => Promise.all(res.map(repo => createPromise(repo))))
      .then(res => callback(null, res))
      .catch(err => callback(err));
  };

  Customer.remoteMethod('repos', {
    description: 'Fetch all repositories on Github that user has access to.',
    http: {
      verb: 'get'
    },
    isStatic: false,
    returns: {
      arg: 'repos',
      type: 'any'
    }
  });
};
