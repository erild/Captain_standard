import config from '../config';
export default (state = {}, action) => {
  switch (action.type) {
    case 'REGISTER_TOKEN':
      window.localStorage.setItem('access_token', action.access_token);
      return {
        ...state,
        access_token: action.access_token || '',
        currentUser: action.payload ? action.payload : null
      };
      break;
    case 'LOGOUT':
      window.localStorage.removeItem('access_token');
      window.location = config.FRONT_URL;
      return {};
      break;
    case 'REDIRECT_AUTH':
      window.location = config.API_URL + '/auth/github?returnTo=' + encodeURIComponent(config.FRONT_URL + '/#' + ((action.payload && action.payload.nextPath) || '/app'));
      return {redirecting: true};
    default:
      return state;
  }
};
