import React, {Component} from "react";
import {Router, Route, browserHistory, IndexRoute} from "react-router";
import LandingPage from "../LandingPage";
import HomePage from "../HomePage";
import store from "../../store";
import agent from "../../agent";
import config from "../../config";

const requireAuth = (nextState) => {
  const access_token = nextState.location.query.access_token || localStorage.getItem('access_token');
  if (access_token && access_token !== 'undefined') {
    agent.setToken(access_token);
    store.dispatch({type: 'REGISTER_TOKEN', payload: agent.Auth.current(), access_token});
  } else {
    window.location = config.API_URL + '/auth/github?returnTo=' + encodeURIComponent(config.FRONT_URL + nextState.location.pathname);
  }
}

class App extends Component {
  render() {
    return (
        <Router history={browserHistory}>
          <Route path="/">
            <IndexRoute component={LandingPage}/>
          </Route>
          <Route path="/app" onEnter={requireAuth}>
            <IndexRoute component={HomePage}/>
          </Route>
        </Router>
    );
  }
}

export default App;
