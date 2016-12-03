import config from '../config';
import {persistStore} from 'redux-persist';
import store from '../store';
import agent from '../agent';

export default (state = {}, action) => {
  switch (action.type) {
    case 'REGISTER_TOKEN':
      agent.setToken(action.access_token);
      return {
        ...state,
        access_token: action.access_token || ''
      };
      break;
    case 'LOGOUT':
      window.location = config.FRONT_URL;
      persistStore(store).purge();
      return {};
      break;
    case 'FETCH_USER':
      return {
        ...state,
        currentUser: action.payload
      };
      break;
    default:
      return state;
  }
};
