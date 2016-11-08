import superagentPromise from 'superagent-promise';
import _superagent from 'superagent';
import config from './config';

const superagent = superagentPromise(_superagent, global.Promise);

const API_ROOT = config.API_URL + '/api';

const responseBody = res => res.body;

let token = null;
const tokenPlugin = req => {
  if (token) {
    req.query({access_token: token});
  }
}

const requests = {
  del: url =>
    superagent.del(`${API_ROOT}${url}`).use(tokenPlugin).then(responseBody),
  get: url =>
    superagent.get(`${API_ROOT}${url}`).use(tokenPlugin).then(responseBody),
  put: (url, body) =>
    superagent.put(`${API_ROOT}${url}`, body).use(tokenPlugin).then(responseBody),
  post: (url, body) =>
    superagent.post(`${API_ROOT}${url}`, body).use(tokenPlugin).then(responseBody)
};

const Auth = {
  current: () =>
    requests.get('/Customers/me')
};


export default {
  Auth,
  setToken: _token => { token = _token; }
};
