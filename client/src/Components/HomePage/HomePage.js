import React from 'react';
import {connect} from 'react-redux';
import Button from 'react-bootstrap/lib/Button';
import agent from '../../agent';
import ProjectsList from '../ProjectsList';

const mapStateToProps = state => ({
  currentUser: state.auth.currentUser,
  projects: state.projects.projects
});

const mapDispatchToProps = dispatch => ({
  onLoad: () => dispatch({type: 'FETCH_PROJECTS', payload: agent.Customers.projects()})
});

class HomePage extends React.Component {
  componentWillMount() {
    this.props.onLoad();
  }

  render() {
    if (this.props.currentUser && this.props.projects) {
        return (
          <div>
            <h1>Hey {this.props.currentUser && this.props.currentUser.username }</h1>
            <Button bsStyle="success" href="/#/app/repos"><i className="fa fa-plus"/> Add a project</Button>
            <br />
            <ProjectsList projects={this.props.projects} location={this.props.location} />
          </div>
        );
    } else {
        return null;
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(HomePage);
