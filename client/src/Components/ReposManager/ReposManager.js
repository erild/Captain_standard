import React from 'react';
import {connect} from 'react-redux';
import './ReposManager.css';
import ProjectsList from '../ProjectsList';
import agent from '../../agent';
import Pagination from 'react-bootstrap/lib/Pagination';


const mapStateToProps = state => ({...state.repos});

const mapDispatchToProps = dispatch => ({
  onLoad: () => dispatch({type: 'FETCH_REPOS', payload: agent.Customers.repos(1)}),
  onSetPage: (page) => dispatch({type: 'FETCH_REPOS', payload: agent.Customers.repos(page)})
});


class ReposManager extends React.Component {
  componentWillMount() {
    this.props.onLoad();
    this.handleSelect = this.handleSelect.bind(this);
  }

  handleSelect(eventKey) {
    this.props.onSetPage(eventKey);
  }

  render() {
    if (this.props.projects) {
      return <div><ProjectsList projects={this.props.projects} />
      <Pagination
        prev
        next
        first
        last
        ellipsis
        boundaryLinks
        items={this.props.pageLast}
        maxButtons={3}
        activePage={this.props.pageCurrent}
        onSelect={this.handleSelect} /></div>;
    }
    return <span>Loading projects...</span>;
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ReposManager);
