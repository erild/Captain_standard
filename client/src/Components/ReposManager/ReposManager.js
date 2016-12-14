import React from 'react';
import {connect} from 'react-redux';
import './ReposManager.css';
import ProjectsList from '../ProjectsList';
import agent from '../../agent';

const mapStateToProps = state => ({...state.repos});

const mapDispatchToProps = dispatch => ({
  onLoad: () => dispatch({type: 'FETCH_REPOS', payload: agent.Customers.repos})
});


class ReposManager extends React.Component {
  componentWillMount() {
    this.props.onLoad();
  }

  render() {
    if (this.props.projects) {
      return <ProjectsList projects={this.props.projects} />;
    }
    return <span>Loading projects...</span>;
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ReposManager);
