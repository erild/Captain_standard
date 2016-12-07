export default (state = {}, action) => {
  let newState;
  switch (action.type) {
    case 'FETCH_PROJECTS':
      newState = {
        ...state,
        projects: action.payload
      };
      break;
    default:
      newState = state;
  }
  return newState;
};
