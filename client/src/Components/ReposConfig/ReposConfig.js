import React from 'react';
import {connect} from 'react-redux';
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
    // console.log(this.state);
    // console.log(this.state.project);
    event.preventDefault();
  }

  render() {
    return this.state.project && this.state.linters ? (
      <div>
        <h2>Configuring {this.state.project.full_name}</h2>
        <p>Please choose a linter : </p>
        <form onSubmit={this.handleSubmit}>
        <ul>
          {this.state.linters.map(function(linter, key) {
            let linterForm = [];
            linterForm.push(<Checkbox onClick={() => this.handleSelectLinter(key)} key={linter.name+"checkbox"}>{linter.name}</Checkbox>);
            if (linter.arg.enable) {
              linterForm.push(<FormControl type="text" placeholder="Directory" value={this.state.linters[key].arg.directory} onChange={() => this.handleLinterDirChange(event, key)} key={key+"_dir"} />);
              linterForm.push(<FormControl type="text" placeholder="Argument" value={this.state.linters[key].arg.arg} onChange={() => this.handleLinterArgChange(event, key)} key={linter.name+"_arg"} />);
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
