const process = require('process');
module.exports = {
  'github': {
    'provider': 'github',
    'module': 'passport-github2',
    'clientID': process.env.GITHUB_CLIENT_ID,
    'clientSecret': process.env.GITHUB_CLIENT_SECRET,
    'callbackURL': process.env.GITHUB_BACKEND_URL + '/auth/github/callback',
    'authPath': '/auth/github',
    'callbackPath': '/auth/github/callback',
    'successRedirect': process.env.NODE_ENV === 'production' ?
      '/#/app' : 'http://localhost:3000/#/app',
    'scope': [],
  },
};
