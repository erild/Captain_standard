import {combineReducers} from 'redux';
import auth from './reducers/auth';
import repos from './reducers/repos';
import notPersisted from './reducers/notPersisted';
import projects from './reducers/projects';

export default combineReducers({
  auth,
  repos,
  notPersisted,
  projects
});
