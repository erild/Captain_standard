export default (state = {}, action) => {
  switch (action.type) {
    case 'REGISTER_TOKEN':
      window.localStorage.setItem('access_token', action.access_token);
      return {
        ...state,
        access_token: action.access_token || '',
        currentUser: action.payload ? action.payload : null
      };
    default:
      return state;
  }
};
