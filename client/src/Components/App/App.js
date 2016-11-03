import React, { Component } from 'react';
import {Router, Route, browserHistory, IndexRoute} from 'react-router';
import LandingPage from '../LandingPage';

export default class App extends Component {
  render() {
    return (
      <Router history={browserHistory}>
        <Route path="/" >
          <IndexRoute component={LandingPage}/>
        </Route>
      </Router>
    );
  }
}
