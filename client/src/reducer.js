import {combineReducers} from 'redux';
import auth from './reducers/auth';
import repos from './reducers/repos';
import notPersisted from './reducers/notPersisted';
import projects from './reducers/projects';
import errors from './reducers/errors';

export default combineReducers({
  auth,
  repos,
  notPersisted,
  projects,
  errors
});
