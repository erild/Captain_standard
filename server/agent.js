const superagentPromise = require('superagent-promise');
const _superagent = require('superagent');
const LoopBackContext = require('loopback-context');

const superagent = superagentPromise(_superagent, Promise);

const GITHUB_API = 'https://api.github.com';

const getToken = (providedUser) => new Promise((resolve, reject) => {
  const ctx = LoopBackContext.getCurrentContext();
  const user = providedUser || (ctx && ctx.get('currentUser'));
  if (!user) {
    return reject('No user was found');
  }
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
  get: (options) =>
    getToken(options.user)
      .then(token => superagent.get((options.raw ? '' : GITHUB_API) + options.url).set('authorization','token ' + token))
      .then(res => Object.keys(res.body).length ? res.body : res.text),
  post: (options) =>
    getToken(options.user)
      .then(token => superagent
        .post((options.raw ? '' : GITHUB_API) + options.url, options.data)
        .set('authorization','token ' + token)
        .set('accept', 'application/vnd.github.black-cat-preview+json')
      )
      .then(res => res.body),
  getToken
}

module.exports = requests;
