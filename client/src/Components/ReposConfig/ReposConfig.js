import React from 'react';
import {connect} from 'react-redux';
import { browserHistory } from 'react-router'
import Button from 'react-bootstrap/lib/Button';
import FormControl from 'react-bootstrap/lib/FormControl';
import agent from '../../agent';
import LinterConfig from '../LinterConfig';


const mapStateToProps = state => ({...state.repos});

const mapDispatchToProps = dispatch => ({
  onLoad: () =>
    dispatch({type: 'FETCH_REPOS', meta: {ifNeeded: true, key: 'repos.projects'}, payload: agent.Customers.repos})
});


class ReposConfig extends React.Component {
  constructor() {
    super();
    let projectLinters = [];
    //TODO Add call to get Project linters if they exist
    if(projectLinters.length == 0) {
      projectLinters.push({linterId: 0, directory: "", arg: ""});
    }
    this.state = { project: null, linters: null, projectLinters: projectLinters };
    agent.Linters.all().then(res => this.setState({linters: res}));
    this.AddLinter = this.AddLinter.bind(this);
    this.handleLinterChange = this.handleLinterChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentWillMount() {
    this.props.onLoad();
    if (this.props.projects) {
      const repo = this.props.projects.filter(project => project.id === Number.parseInt(this.props.params.projectId, 10))[0];
      this.setState({project: repo });
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.projects) {
      const repo = nextProps.projects.filter(project => project.id === Number.parseInt(this.props.params.projectId, 10))[0];
      this.setState({project: repo });
    }
  }

  handleLinterChange(linterInfo, key) {
    let projectLinters = this.state.projectLinters;
    linterInfo === 'delete' ? projectLinters.splice(key, 1) : projectLinters[key] = linterInfo;
    this.setState({projectLinters: projectLinters});
  }

  handleSubmit(event) {
    agent.Customers.current().then(user => {
      agent.Project.put(this.state.project.full_name, this.state.project.id, user.id).then(() => {
        agent.Project.deleteLinters(this.state.project.id).then(() => {
          this.state.projectLinters.forEach(linter => {
            agent.Project.putLinter(this.state.project.id, linter.linterId, linter.directory, linter.arg);
          });
        });
      });
      browserHistory.push('/#/app');
      window.location.reload();
    });
    event.preventDefault();
  }

  AddLinter() {
    let projectLinters = this.state.projectLinters;
    projectLinters.push({linterId: 0, directory: "", arg: ""});
    this.setState({projectLinters: projectLinters});
  }

  render() {

    return this.state.project && this.state.linters ? (
      <div>
        <h2>Configuring {this.state.project.full_name}</h2>
        <form onSubmit={this.handleSubmit}>
        <ul>
          {this.state.projectLinters.map((projectLinter, key) => {
            return (
              <LinterConfig linters={this.state.linters} selectedLinter={projectLinter.linterId} directory={projectLinter.directory} arg={projectLinter.arg} key={key} onChange={event => this.handleLinterChange(event, key)}/>
              )
            })}
          <Button bsStyle="primary" onClick={this.AddLinter}>Add another linter</Button>
        </ul>
        <Button type="submit" bsStyle="success">Save</Button>
        </form>
      </div>
    ) : null;
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ReposConfig);
