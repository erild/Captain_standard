import React, {Component} from 'react';
import {Router, Route, hashHistory, IndexRoute} from 'react-router';
import {connect} from 'react-redux';
import LandingPage from '../LandingPage';
import HomePage from '../HomePage';
import agent from '../../agent';
import Template from '../Template';
import ReposManager from '../ReposManager';
import ScriptsManager from '../ScriptsManager';
import ReposConfig from '../ReposConfig';

const mapStateToProps = state => ({rehydrated: state.notPersisted.rehydrated});

const mapDispatchToProps = dispatch => ({
  requireAuth: (nextState) =>
    // https://github.com/rt2zz/redux-persist/issues/193
    dispatch({type: 'FETCH_USER', meta: {location: nextState.location, authenticated: true}, payload: agent.Customers.current})
});

class App extends Component {
  render() {
    if (!(this.props && this.props.rehydrated)) {
      return <p>Loading...</p>;
    }
    return (
        <Router history={hashHistory}>
          <Route path="/">
            <IndexRoute component={LandingPage}/>
          </Route>
          <Route path="/app" onEnter={this.props.requireAuth} component={Template}>
            <IndexRoute component={HomePage}/>
            <Route path="repos" component={ReposManager} />
            <Route path="scripts" component={ScriptsManager} />
            <Route path="projects/:projectId/edit" component={ReposConfig}/>
          </Route>
        </Router>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(App);
