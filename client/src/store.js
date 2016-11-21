import {applyMiddleware, createStore} from "redux";
import createLogger from "redux-logger";
import reducer from "./reducer";

const isPromise = val => val && typeof val.then === 'function';

const promiseMiddleware = store => next => action => {
  if (isPromise(action.payload)) {
    return action.payload.then(
      result => store.dispatch(Object.assign({}, action, {payload: result})),
      error => store.dispatch(Object.assign({}, action, {payload: error, error: true}))
    );
  } else if (isPromise(action)) {
    return action.then(store.dispatch);
  }
  return next(action);
}

const store = createStore(reducer,
  process.env.NODE_ENV !== 'production' ?
    applyMiddleware(promiseMiddleware, createLogger()) :
    applyMiddleware(promiseMiddleware)
);

export default store;