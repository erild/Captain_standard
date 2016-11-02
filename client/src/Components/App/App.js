import React, { Component } from 'react';
import {Router, Route, browserHistory} from 'react-router';
import LandingPage from '../LandingPage';

export default class App extends Component {
  render() {
    return (
      <Router history={browserHistory}>
        <Route path="/" component={LandingPage}>
        </Route>
      </Router>
    );
  }
}
