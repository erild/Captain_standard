import React, {Component} from "react";
import {Router, Route, hashHistory, IndexRoute} from "react-router";
import LandingPage from "../LandingPage";
import HomePage from "../HomePage";
import store from "../../store";
import agent from "../../agent";
import Template from "../Template";
import ReposManager from "../ReposManager";
import ReposConfig from "../ReposConfig";

const requireAuth = (nextState) => {
  const access_token = nextState.location.query.access_token || localStorage.getItem('access_token');
  if (access_token && access_token !== 'undefined') {
    agent.setToken(access_token);
    store.dispatch({type: 'REGISTER_TOKEN', payload: agent.Auth.current(), access_token});
  } else {
    store.dispatch({type: 'REDIRECT_AUTH', payload: {nextPath: nextState.location.pathname}});
  }
}

class App extends Component {
  render() {
    return (
        <Router history={hashHistory}>
          <Route path="/">
            <IndexRoute component={LandingPage}/>
          </Route>
          <Route path="/app" onEnter={requireAuth} component={Template}>
            <IndexRoute component={HomePage}/>
            <Route path="repos">
              <IndexRoute component={ReposManager}/>
              <Route path=":projectId/edit" component={ReposConfig}/>
            </Route>
          </Route>
        </Router>
    );
  }
}

export default App;
