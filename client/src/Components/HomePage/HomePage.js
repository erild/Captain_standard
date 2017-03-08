import React from 'react';
import {connect} from 'react-redux';
import Button from 'react-bootstrap/lib/Button';
import agent from '../../agent';
import ProjectsList from '../ProjectsList';
import './HomePage.css';

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
            <h4>If you want Captain Standard to post comments on your PR, you need to install Captain Standard's GitHub integration, by clicking <a href="https://github.com/integrations/captain-standard/installations/new">here</a>.</h4>
            <Button bsStyle="success" className="button-left" href="/#/app/repos"><i className="fa fa-plus"/> Add a project</Button>
            <Button bsStyle="success" className="button-right" href="/#/app/scripts"><i className="fa fa-cog"/> Handle custom scripts</Button>
            <br />
            <ProjectsList projects={this.props.projects} configured={true} />
          </div>
        );
    } else {
        return null;
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(HomePage);
