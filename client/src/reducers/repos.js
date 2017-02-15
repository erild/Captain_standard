export default (state = {}, action) => {
  let newState;
  switch (action.type) {
    case 'FETCH_REPOS':
      newState = {
        ...state,
        projects: action.payload.repos.repos,
        pageCurrent: action.payload.repos.pageCurrent,
        pageLast: action.payload.repos.pageTotal
      }
      break;
    default:
      newState = state;
  }
  return newState;
};
