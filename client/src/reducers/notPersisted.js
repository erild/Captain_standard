import { REHYDRATE } from 'redux-persist/constants';
import config from '../config';

export default (state = {}, action) => {
  switch (action.type) {
    case REHYDRATE:
      return {
        ...state,
        rehydrated: true
      };
      break;
    case 'REDIRECT_AUTH':
      window.location = config.API_URL + '/auth/github?returnTo=' + encodeURIComponent(config.FRONT_URL + '/#' + ((action.payload && action.payload.nextPath) || '/app'));
      return {
        ...state,
        redirecting: true
      };
      break;
    default:
      return state;
  }
};
