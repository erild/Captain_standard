const superagentPromise = require('superagent-promise');
const _superagent = require('superagent');
const LoopBackContext = require('loopback-context');
const KJUR = require('jsrsasign').KJUR;

const superagent = superagentPromise(_superagent, Promise);

const GITHUB_API = 'https://api.github.com';

const getToken = (options) => new Promise((resolve, reject) => {
  if (options.installationId) {
    const jwt = generateJWT();
    superagent
      .post(`${GITHUB_API}/installations/${options.installationId}/access_tokens`)
      .set('accept', 'application/vnd.github.machine-man-preview+json')
      .set('authorization', 'Bearer ' + jwt)
      .then(res => resolve(res.body.token))
      .catch(err => {
        console.error(err);
        reject(err);
      });
  } else {
    const ctx = LoopBackContext.getCurrentContext();
    const user = options.user || (ctx && ctx.get('currentUser'));
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
  }
});

const generateJWT = () => {
  const payload = {
    iat: KJUR.jws.IntDate.get('now'),
    exp: KJUR.jws.IntDate.get('now') + 60,
    iss: parseInt(process.env.INTEGRATION_ID, 10),
  };
  const header = {alg: 'RS256', typ: 'JWT'};
  return KJUR.jws.JWS.sign(
    'RS256',
    JSON.stringify(header),
    JSON.stringify(payload),
    process.env.PRIVATE_KEY.replace(/\\n/g, '\n')
  );
};

const requests = {
  get: (options) =>
    getToken(options)
      .then(token => {
        let request = superagent
          .get((options.raw ? '' : GITHUB_API) + options.url)
          .set('authorization', 'token ' + token);
        for (let header in (options.headers || {})) {
          request = request.set(header, options.headers[header]);
        }
        if (options.buffer) {
          request = request.buffer();
        }
        return request;
      })
      .then(res => {
        if (options.fullResponse) {
          return res;
        } else if (Object.keys(res.body).length) {
          return res.body;
        } else {
          return res.text;
        }
      }),
  post: (options) =>
    getToken(options)
      .then(token => superagent
        .post((options.raw ? '' : GITHUB_API) + options.url, options.data)
        .set('authorization', 'token ' + token)
        .set('accept', 'application/vnd.github.black-cat-preview+json')
      )
      .then(res => res.body),
  delete: (options) =>
    getToken(options)
      .then(token => superagent
        .del((options.raw ? '' : GITHUB_API) + options.url)
        .set('authorization', 'token ' + token))
      .then(res => res.body),
  getToken,
};

module.exports = requests;
