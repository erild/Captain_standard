const process = require('process');
module.exports = {
  "github": {
    "provider": "github",
    "module": "passport-github2",
    "clientID": process.env.GITHUB_CLIENT_ID,
    "clientSecret": process.env.GITHUB_CLIENT_SECRET,
    "callbackURL": process.env.GITHUB_CALLBACK_URL,
    "authPath": "/auth/github",
    "callbackPath": "/auth/github/callback",
    "successRedirect": "/api/Customers/me",
    "scope": ["user"]
  }
};
