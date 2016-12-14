import superagentPromise from 'superagent-promise';
import _superagent from 'superagent';
import config from './config';
import store from './store';

const superagent = superagentPromise(_superagent, global.Promise);

const API_ROOT = config.API_URL + '/api';

const responseBody = res => res.body;

let token = null;
const tokenPlugin = req => {
  if (token) {
    req.query({access_token: token});
  }
};

const redirectUnauthenticated = err => {
  if (err && err.status === 401) {
    store.dispatch({type: 'REDIRECT_AUTH'});
  }
};

const requests = {
  del: url =>
    superagent.del(`${API_ROOT}${url}`).use(tokenPlugin).then(responseBody).catch(redirectUnauthenticated),
  get: url =>
    superagent.get(`${API_ROOT}${url}`).use(tokenPlugin).then(responseBody).catch(redirectUnauthenticated),
  put: (url, body) =>
    superagent.put(`${API_ROOT}${url}`, body).use(tokenPlugin).then(responseBody).catch(redirectUnauthenticated),
  post: (url, body) =>
    superagent.post(`${API_ROOT}${url}`, body).use(tokenPlugin).then(responseBody).catch(redirectUnauthenticated)
};

const Customers = {
  current: () =>
    requests.get('/Customers/me'),
  repos: () =>
    requests.get('/Customers/me/repos').then(res => res, err => requests.get('/Customers/me/repos')),
  projects: () =>
    requests.get('/Customers/me/projects')
};

const Linters = {
  all: () =>
    requests.get('/Linters')
};

const Project = {
  put: (projectName, projectId, cloneUrl, runCmd, customerId) => {
      requests.put('/Projects',{ name: projectName, id: projectId, cloneUrl: cloneUrl, runCmd: runCmd})
      .then(() => requests.put(`/Projects/${projectId}/customers/rel/${customerId}`,{}));
    },
  putLinter: (projectId, linterId, directory, argument) => requests.put(`/Projects/${projectId}/linters/rel/${linterId}`, { directory: directory, arguments: argument }),
  deleteLinters: (projectId) => requests.del(`/Projects/${projectId}/linters/delAllRel`),
  getProjectLinters: (projectId) => requests.get('/ProjectLinters', {filter: {'where': {'projectId': projectId}}})
};

export default {
  Customers,
  Linters,
  Project,
  setToken: _token => { token = _token; },
  getToken: () => token
};
