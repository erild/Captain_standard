const superagentPromise = require('superagent-promise');
const _superagent = require('superagent');
const LoopBackContext = require('loopback-context');

const superagent = superagentPromise(_superagent, Promise);

const GITHUB_API = 'https://api.github.com';

const getToken = () => new Promise((resolve, reject) => {
  const ctx = LoopBackContext.getCurrentContext();
  const user = ctx && ctx.get('currentUser');
  user.identities((err, result) => {
    if (err) {
      reject(err);
    } else {
      const token = result[0].credentials.accessToken;
      resolve(token);
    }
  });
});

const requests = {
  get: url =>
    getToken().then(token => superagent.get(GITHUB_API + url).set('authorization','token ' + token)).then(res => res.body),
  post: (url, data) =>
    getToken().then(token => superagent.post(GITHUB_API + url, data).set('authorization','token ' + token)).then(res => res.body),
  delete: (url) =>
    getToken().then(token => superagent.del(GITHUB_API + url).set('authorization','token ' + token)).then(res => res.body)
}

module.exports = requests;
