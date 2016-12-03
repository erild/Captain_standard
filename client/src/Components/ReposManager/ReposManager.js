import React from 'react';
import {connect} from 'react-redux';
import {Link} from 'react-router';
import Well from 'react-bootstrap/lib/Well';
import './ReposManager.css';
import agent from '../../agent';

const mapStateToProps = state => ({...state.repos});

const mapDispatchToProps = dispatch => ({
  onLoad: () => dispatch({type: 'FETCH_REPOS', meta: {ifNeeded: true, key: 'repos.projects'}, payload: agent.Customers.repos})
});


class ReposManager extends React.Component {
  componentWillMount() {
    this.props.onLoad();
  }

  render() {
    if (this.props.projects) {
      return (
        <ul>{this.props.projects.map((project) => (
          <Well key={project.id}>
            <Link to={`${this.props.location.pathname}/${project.id}/edit`}>{project.full_name}</Link>
            <span>(Projet non configuré)</span>
          </Well>
        ))}</ul>
      );
    }
    return <span>Loading projects...</span>;
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ReposManager);
