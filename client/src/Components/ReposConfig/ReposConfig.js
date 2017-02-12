import React from "react";
import {connect} from "react-redux";
import {browserHistory} from "react-router";
import Button from "react-bootstrap/lib/Button";
import FormControl from "react-bootstrap/lib/FormControl";
import agent from "../../agent";
import LinterConfig from "../LinterConfig";
import WebHookModal from "../WebHookModal";


const mapStateToProps = state => ({...state.projects});

const mapDispatchToProps = dispatch => ({
  onLoad: (id) =>
    agent.Project.get(id).then(res => dispatch({type: 'FETCH_PROJECT', payload: res}))
});


class ReposConfig extends React.Component {
  constructor() {
    super();
    this.state = { linters: null, projectLinters: null, submitting: false, webhookModal: false };
    agent.Linters.all().then(res => this.setState({linters: res}));
    this.AddLinter = this.AddLinter.bind(this);
    this.handleLinterChange = this.handleLinterChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleWebHookModal = this.handleWebHookModal.bind(this);
  }

  componentWillMount() {
    this.props.onLoad(this.props.params.projectId).then(() => {
      agent.Project.getProjectLinters(this.props.project.id).then(res => this.setState({projectLinters: res}));
      this.setState({configCmd: this.props.project.configCmd});
    });
  }

  handleLinterChange(linterInfo, key) {
    let projectLinters = this.state.projectLinters;
    linterInfo === 'delete' ? projectLinters.splice(key, 1) : projectLinters[key] = Object.assign(projectLinters[key], linterInfo);
    this.setState({projectLinters: projectLinters});
  }

  handleWebHookModal(event) {
    if (event.hasOwnProperty('secret')) {
      agent.Project.putWebHookSecret(this.props.project.id, event.secret);
    }
    browserHistory.push('/#/app');
    window.location.reload();
  }

  handleSubmit(event) {
    this.setState({submitting: true});
    agent.Customers.current().then(user => {
      agent.Project.put(this.props.project.full_name, this.props.project.id, this.props.project.cloneUrl, this.state.configCmd).then((res) => {
        agent.Project.linkCustomer(this.props.project.id, user.id);
        agent.Project.updateAllLinterRel(this.props.project.id, this.state.projectLinters);
        if (res.webhook_secret == "") {
          this.setState({webhookModal: true});
        } else {
          browserHistory.push('/#/app');
          window.location.reload();
        }
      });
    });
    event.preventDefault();
  }

  AddLinter() {
    let projectLinters = this.state.projectLinters;
    projectLinters.push({projectId: this.props.project.id, linterId: 1, directory: "", arguments: ""});
    this.setState({projectLinters: projectLinters});
  }

  render() {

    return this.props.project && this.state.linters && this.state.projectLinters ? (
      <div>
        <h2>Configuring {this.props.project.full_name}</h2>
        <div>
          <span>Commands to initialize the project and install linter dependencies:</span>
          <FormControl componentClass="textarea" style={{ height: 150, "maxWidth": 500 }} placeholder="npm install --only=dev" value={this.state.configCmd} onChange={event => this.setState({"configCmd": event.target.value})}/>
        </div>
        <p>Please choose a linter : </p>
        <form onSubmit={this.handleSubmit}>
        <ul>
          {this.state.projectLinters.map((projectLinter, key) => {
            return (
              <LinterConfig linters={this.state.linters} selectedLinter={projectLinter.linterId} directory={projectLinter.directory} arguments={projectLinter.arguments} key={key} onChange={event => this.handleLinterChange(event, key)}/>
              )
            })}
          <Button bsStyle="primary" onClick={this.AddLinter}>Add another linter</Button>
        </ul>
        <Button type="submit" bsStyle="success" disabled={this.state.submitting}>Save</Button>
        </form>
        <WebHookModal display={this.state.webhookModal} API_ROOT={agent.API_ROOT} onChange={this.handleWebHookModal}/>
      </div>
    ) : null;
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ReposConfig);
