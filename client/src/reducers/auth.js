import config from '../config';
import {persistStore} from 'redux-persist';
import store from '../store';
import agent from '../agent';

export default (state = {}, action) => {
  let newState;
  switch (action.type) {
    case 'REGISTER_TOKEN':
      agent.setToken(action.access_token);
      newState = {
        ...state,
        access_token: action.access_token || ''
      };
      break;
    case 'LOGOUT':
      window.location = config.FRONT_URL;
      persistStore(store).purge();
      newState = {};
      break;
    case 'FETCH_USER':
      newState = {
        ...state,
        currentUser: action.payload
      };
      break;
    default:
      newState = state;
  }
  return newState;
};
