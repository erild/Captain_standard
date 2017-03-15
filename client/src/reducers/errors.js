export default (state = [], action) => {
  let newState;
  switch (action.type) {
    case 'ADD_ERROR':
      newState = [
        ...state,
        action.payload
      ];
      break;
    case 'REMOVE_ERROR':
      newState = state.filter((error, index) => index !== action.payload);
      break;
    case 'CLEAR_ERRORS':
      newState = [];
      break;
    default:
      newState = state;
  }
  return newState;
};
