import { REHYDRATE } from 'redux-persist/constants';
import config from '../config';

export default (state = {}, action) => {
  let newState;
  switch (action.type) {
    case REHYDRATE:
      newState = {
        ...state,
        rehydrated: true
      };
      break;
    case 'REDIRECT_AUTH':
      window.location = config.API_URL + '/auth/github?returnTo=' + encodeURIComponent(config.FRONT_URL + '/#' + ((action.payload && action.payload.nextPath) || '/app'));
      newState = {
        ...state,
        redirecting: true
      };
      break;
    default:
      newState = state;
  }
  return newState;
};
