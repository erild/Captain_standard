export default (state = {}, action) => {
  switch (action.type) {
    case 'FETCH_REPOS':
      return {
        ...state,
        projects: action.payload.repos
      }
      break;
    case 'FETCH_REPO':
      return {
        ...state,
        project: state.repos.filter(project => project.id === Number.parseInt(action.payload.id, 10))[0]
      };
      break;
    default:
      return state;
  }
};
