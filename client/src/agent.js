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
  if (err.status === 401) {
    store.dispatch({type: 'REDIRECT_AUTH'});
  } else {
    const error = err.response.type === 'application/json' ? JSON.parse(err.response.text).error : new Error(err.response.text);
    store.dispatch({type: 'ADD_ERROR', payload: error});
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
  repos: (page) =>
    requests.get(`/Customers/me/repos?page=${page}`).then(res => res, err => requests.get(`/Customers/me/repos?page=${page}`)),
  projects: () =>
    requests.get('/Customers/me/projects'),
  scripts: () =>
    requests.get('/Customers/me/scripts')
};

const Linters = {
  all: () =>
    requests.get('/Linters')
};

const Project = {
  get:(projectId) => requests.get(`/Projects/${projectId}`),
  put: (projectName, projectId, cloneUrl, configCmd) => requests.put('/Projects',{ fullName: projectName, id: projectId, cloneUrl: cloneUrl, configCmd: configCmd}),
  delete: (projectId) => requests.del(`/Projects/${projectId}`),
  linkCustomer: (projectId, customerId) => requests.put(`/Projects/${projectId}/customers/rel/${customerId}`,{}),
  getProjectLinters: (projectId) => requests.get(`/ProjectLinters?filter[where][projectId]=${projectId}`),
  getProjectScripts: (projectId) => requests.get(`/ProjectScripts?filter[where][projectId]=${projectId}`),
  getProjectInstallation: (fullName) => requests.get(`/ProjectInstallations?filter[where][fullName]=${fullName}`),
  updateAllRel: (projectId, listLinter, listScript) => requests.post(`/Projects/${projectId}/updateAllRel`, { listLinterRel: listLinter, listScriptRel: listScript})
};

const Script = {
  get:(scriptId) => requests.get(`/Scripts/${scriptId}`),
  put:(scriptObject) => requests.put('/Scripts', scriptObject)
};


export default {
  API_ROOT,
  Customers,
  Linters,
  Project,
  Script,
  setToken: _token => { token = _token; },
  getToken: () => token
};
