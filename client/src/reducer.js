import {combineReducers} from 'redux';
import auth from './reducers/auth';
import repos from './reducers/repos';
import notPersisted from './reducers/notPersisted';

export default combineReducers({
  auth,
  repos,
  notPersisted
});
