import React from 'react';
import {connect} from 'react-redux';
import {Link} from 'react-router';
import Well from 'react-bootstrap/lib/Well';

import './ReposManager.css';
import agent from '../../agent';

const mapStateToProps = state => ({
  currentUser: state.auth.currentUser
});

const mapDispatchToProps = dispatch => ({});


class ReposManager extends React.Component {
  constructor() {
    super();
    this.state = { projects: null };
    agent.getAllProjects().then(res => {console.log(res); this.setState({ projects: res.repos })});
  };
  render() {
    if (this.state.projects) {
      return (
        <ul>{this.state.projects.map((project) => (
          <Well key={project.id}>
            <Link to={`${this.props.location.pathname}/${project.id}/edit`}>{project.name}</Link>
            <span>(Projet non configuré)</span>
          </Well>
        ))}</ul>
      );
    }
    return <span>Loading projects...</span>;
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ReposManager);
