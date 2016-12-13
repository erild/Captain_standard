import React from 'react';
import {connect} from 'react-redux';
import { browserHistory } from 'react-router'
import Button from 'react-bootstrap/lib/Button';
import Checkbox from 'react-bootstrap/lib/Checkbox';
import FormControl from 'react-bootstrap/lib/FormControl';
import agent from '../../agent';


const mapStateToProps = state => ({...state.repos});

const mapDispatchToProps = dispatch => ({
  onLoad: () =>
    dispatch({type: 'FETCH_REPOS', meta: {ifNeeded: true, key: 'repos.projects'}, payload: agent.Customers.repos})
});


class ReposConfig extends React.Component {
  constructor() {
    super();
    this.state = { project: null, linters: null };
    agent.Linters.all().then(res => {
      res.map(linter => linter.arg = {enable:false, directory:"", arg:""})
      this.setState({linters: res});
    });
    this.handleSelectLinter = this.handleSelectLinter.bind(this);
    this.handleLinterDirChange = this.handleLinterDirChange.bind(this);
    this.handleLinterArgChange = this.handleLinterArgChange.bind(this);
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

  handleSelectLinter(linterKey) {
    let lintersState = this.state.linters;
    lintersState[linterKey].arg.enable = !lintersState[linterKey].arg.enable;
    this.setState({linters: lintersState });
  }

  handleLinterDirChange(event, linterKey) {
    let lintersState = this.state.linters;
    lintersState[linterKey].arg.directory = event.target.value;
    this.setState({linters: lintersState });
  }

  handleLinterArgChange(event, linterKey) {
    let lintersState = this.state.linters;
    lintersState[linterKey].arg.arg = event.target.value;
    this.setState({linters: lintersState });
  }

  handleSubmit(event) {
    agent.Customers.current().then(user => {
      agent.Project.put(this.state.project.name, this.state.project.id,
        this.state.project.clone_url, this.state.configCmds, user.id);

      this.state.linters.forEach(linter => {
        if(linter.arg.enable) {
          agent.Project.putLinter(this.state.project.id, linter.id, linter.arg.directory, linter.arg.arg);
        }
      });
      browserHistory.push('/#/app');
      window.location.reload();
    });
    event.preventDefault();
  }

  render() {
    return this.state.project && this.state.linters ? (
      <div>
        <h2>Configuring {this.state.project.full_name}</h2>
        <div>
          <span>Commands to initialize the project and install linter dependencies:</span>
          <FormControl componentClass="textarea" style={{ height: 150, "maxWidth": 500 }} placeholder="npm install --only=dev"/>
        </div>
        <p>Please choose a linter : </p>
        <form onSubmit={this.handleSubmit}>
        <ul>
          {this.state.linters.map(function(linter, key) {
            let linterForm = [];
            linterForm.push(<Checkbox onClick={() => this.handleSelectLinter(key)} key={linter.name+"checkbox"}>{linter.name}</Checkbox>);
            if (linter.arg.enable) {
              linterForm.push(<FormControl type="text" placeholder="Directory" value={this.state.linters[key].arg.directory} onChange={event => this.handleLinterDirChange(event, key)} key={key+"_dir"} />);
              linterForm.push(<FormControl type="text" placeholder="Argument" value={this.state.linters[key].arg.arg} onChange={event => this.handleLinterArgChange(event, key)} key={linter.name+"_arg"} />);
            }
            return linterForm
          }, this)}
        </ul>
        <Button type="submit" bsStyle="success">Save</Button>
        </form>
      </div>
    ) : null;
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ReposConfig);
