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
    throw error;
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
  allWithRoles: () =>
    requests.get('/Customers?filter[include]=roles'),
  current: () =>
    requests.get('/Customers/me?filter[include]=roles'),
  repos: (page) =>
    requests.get(`/Customers/me/repos?page=${page}`).then(res => res, err => requests.get(`/Customers/me/repos?page=${page}`)),
  projects: () =>
    requests.get('/Customers/me/projects'),
  addAdmin: (customerId) =>
    requests.post('/Customers/addAdmin', {customerId: customerId}),
  removeAdmin: (customerId) =>
    requests.post('/Customers/delAdmin', {customerId: customerId})
};

const Linters = {
  all: () =>
    requests.get('/Linters')
};

const Project = {
  get:(projectId) => requests.get(`/Projects/${projectId}`),
  put: (projectName, projectId, cloneUrl, configCmd) => requests.put('/Projects', {
    fullName: projectName,
    id: projectId,
    cloneUrl,
    configCmd
  }),
  delete: (projectId) => requests.del(`/Projects/${projectId}`),
  linkCustomer: (projectId, customerId) => requests.put(`/Projects/${projectId}/customers/rel/${customerId}`,{}),
  getProjectLinters: (projectId) => requests.get(`/ProjectLinters?filter[where][projectId]=${projectId}`),
  getProjectScripts: (projectId) => requests.get(`/ProjectScripts?filter[where][projectId]=${projectId}`),
  getProjectConfigCmds: (projectId) => requests.get(`/ProjectConfigCmds?filter[where][projectId]=${projectId}`),
  getProjectInstallation: (fullName) => requests.get(`/ProjectInstallations?filter[where][fullName]=${fullName}`),
  updateAllRel: (projectId, listLinterRel, listScriptRel, listConfigCmdRel) => requests.post(`/Projects/${projectId}/updateAllRel`, {
    listLinterRel,
    listScriptRel,
    listConfigCmdRel,
  })
};

const Script = {
  get:(scriptId) => requests.get(`/Scripts/${scriptId}`),
  all:(scriptId) => requests.get('/Scripts/'),
  del:(scriptId) => requests.del(`/Scripts/${scriptId}`),
  put:(scriptObject) => requests.put('/Scripts', scriptObject)
};

const ConfigCmds = {
  all: () => requests.get('/ConfigCmds')
}
export default {
  API_ROOT,
  Customers,
  Linters,
  Project,
  Script,
  ConfigCmds,
  setToken: _token => { token = _token; },
  getToken: () => token
};
