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
    case 'FETCH_REPO':
      newState = {
        ...state,
        project: state.repos.repos.filter(project => project.id === Number.parseInt(action.payload.id, 10))[0]
      };
      break;
    default:
      newState = state;
  }
  return newState;
};
