import {applyMiddleware, createStore, compose} from 'redux';
import {persistStore, autoRehydrate} from 'redux-persist';
import createLogger from 'redux-logger';
import reducer from './reducer';
import agent from './agent';

const isPromise = val => val && typeof val.then === 'function';

/**
 * Action expected:
 * {
 *  type: 'WHATEVER',
 *  payload: <Promise>
 * }
 */
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

/**
 * Ensures that user is authenticated before executing payload.request.
 * Action expected:
 * {
 *  type: 'WHATEVER',
 *  meta: {
 *    authenticated: true,
 *    location: location, // Object (can be obtained in nextState.location in onEnter call with react-router) to be redirected at the right path after auth
 *  },
 *  payload: functionReturningAPromise // For instance agent.Customers.current
 * }
 */
const authenticatedFetchMiddleware = store => next => action => {
  if (!action.meta || !action.meta.authenticated || action.type.indexOf('persist') === 0) {
    return next(action);
  }
  const state = store.getState();
  const access_token = (action.meta.location && action.meta.location.query.access_token) || state.auth.access_token || agent.getToken();
  if (access_token && access_token !== 'undefined') {
    store.dispatch({type: 'REGISTER_TOKEN', access_token});
  } else {
    return store.dispatch({
      type: 'REDIRECT_AUTH',
      payload: {
        nextPath: action.meta.location && action.meta.location.pathname
      }
    });
  }
  delete action.meta.authenticated;
  return next(action);
};

/**
 * Ensures that data is not already in state tree before fetching it
 * Action expected:
 * {
 *  type: 'WHATEVER',
 *  meta: {
 *    ifNeeded: true,
 *  },
 *  payload: functionReturningAPromise, // For instance agent.Customers.current
 * }
 */
const ifNeededFetchMiddleware = store => next => action => {
  if (!action.meta || !action.meta.ifNeeded || action.type.indexOf('persist') === 0) {
    return next(action);
  }
  const state = store.getState();
  const path = action.meta.key.split('.');
  if (!state[path[0]][path[1]]) {
    delete action.meta.ifNeeded;
    return next(action);
  }
};

/**
 * Makes the call after all middlewars have applied
 * Action expected:
 * {
 *  type: 'WHATEVER',
 *  meta: {
 *    args: ['arg1', 'arg2'],
 *  },
 *  payload: function, // For instance agent.Customers.current. Last argument is dispatch function.
 * }
 */
const thunkMiddleware = store => next => action => {
  if (action.payload && typeof action.payload === 'function') {
    return next({
      ...action,
      payload: action.payload.apply(null, (action.meta && action.meta.args && action.meta.args.concat(store.dispatch)) || [store.dispatch])
    });
  }
  return next(action);
};

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const store = createStore(reducer, {},
  process.env.NODE_ENV !== 'production' ?
    composeEnhancers(autoRehydrate(), applyMiddleware(createLogger(), ifNeededFetchMiddleware, authenticatedFetchMiddleware, thunkMiddleware, promiseMiddleware)) :
    composeEnhancers(autoRehydrate(), applyMiddleware(ifNeededFetchMiddleware, authenticatedFetchMiddleware, thunkMiddleware, promiseMiddleware)),
);

persistStore(store, {blacklist: ['notPersisted']});

export default store;
