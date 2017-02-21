import React from 'react';
import {connect} from 'react-redux';
import { browserHistory } from 'react-router'
import Button from 'react-bootstrap/lib/Button';
import FormControl from 'react-bootstrap/lib/FormControl';
import agent from '../../agent';
import LinterConfig from '../LinterConfig';
import ScriptConfig from '../ScriptConfig';
import WebHookModal from '../WebHookModal';
import './ReposConfig.css';


const mapStateToProps = state => ({...state.projects});

const mapDispatchToProps = dispatch => ({
  onLoad: (id) =>
    agent.Project.get(id).then(res => dispatch({type: 'FETCH_PROJECT', payload: res}))
});


class ReposConfig extends React.Component {
  constructor() {
    super();
    this.state = { linters: null, customScripts: null, projectLinters: null, projectScripts: null, submitting: false, webhookModal: false };
    agent.Linters.all().then(res => this.setState({linters: res}));
    agent.Customers.scripts().then(res => this.setState({customScripts: res}));
    this.handleLinterChange = this.handleLinterChange.bind(this);
    this.handleScriptChange = this.handleScriptChange.bind(this);
    this.handleWebHookModal = this.handleWebHookModal.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.AddLinter = this.AddLinter.bind(this);
    this.AddScript = this.AddScript.bind(this);
  }

  componentWillMount() {
    this.props.onLoad(this.props.params.projectId).then(() => {
      agent.Project.getProjectLinters(this.props.project.id).then(res => this.setState({projectLinters: res}));
      agent.Project.getProjectScripts(this.props.project.id).then(res => this.setState({projectScripts: res}));
      this.setState({configCmd: this.props.project.configCmd});
    });
  }

  handleLinterChange(linterInfo, key) {
    let projectLinters = this.state.projectLinters;
    linterInfo === 'delete' ? projectLinters.splice(key, 1) : projectLinters[key] = Object.assign(projectLinters[key], linterInfo);
    this.setState({projectLinters: projectLinters});
  }

  handleScriptChange(scriptInfo, key) {
    if(scriptInfo === 'update') {
      agent.Customers.scripts().then(res => {
        this.setState({customScripts: res});
        if (res.length) {
          let projectScripts = this.state.projectScripts;
          Object.assign(projectScripts[key], { scriptId: res[res.length-1].id });
          this.setState({ projectScripts: projectScripts })
        }
      });
    } else {
      let projectScripts = this.state.projectScripts;
      scriptInfo === 'delete' ? projectScripts.splice(key, 1) : projectScripts[key] = Object.assign(projectScripts[key], scriptInfo);
      this.setState({projectScripts: projectScripts});
    }
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
    let user;
    let project;
    Promise.all([
      agent.Customers.current(),
      agent.Project.put(this.props.project.fullName, this.props.project.id, this.props.project.cloneUrl, this.state.configCmd),
    ]).then(res => {
        user = res[0];
        project = res[1];
        return Promise.all([
          agent.Project.linkCustomer(this.props.project.id, user.id),
          agent.Project.updateAllRel(this.props.project.id, this.state.projectLinters, this.state.projectScripts),
        ]);
    }).then(() => {
      if (project.webhookSecret === '') {
        this.setState({webhookModal: true});
      } else {
        browserHistory.push('/#/app');
        window.location.reload();
      }
    });
    event.preventDefault();
  }

  AddLinter() {
    let projectLinters = this.state.projectLinters;
    projectLinters.push({projectId: this.props.project.id, linterId: 1, directory: "", arguments: ""});
    this.setState({projectLinters: projectLinters});
  }

  AddScript() {
    let projectScripts = this.state.projectScripts;
    this.state.customScripts.length ? projectScripts.push({projectId: this.props.project.id, scriptId: this.state.customScripts[0].id, directory: ""}) : projectScripts.push({projectId: this.props.project.id, scriptId: null, directory: ""})
    this.setState({projectScripts: projectScripts});
  }

  render() {

    return this.props.project && this.state.linters && this.state.customScripts && this.state.projectLinters && this.state.projectScripts ? (
      <div>
        <h2>Configuring {this.props.project.fullName}</h2>
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
          {this.state.projectScripts.map((projectScript, key) => {
            return (
              <ScriptConfig scripts={this.state.customScripts} selectedScript={projectScript.scriptId} directory={projectScript.directory} key={key} onChange={event => this.handleScriptChange(event, key)}/>
              )
            })}
          <Button bsStyle="primary" className="button-left" onClick={this.AddLinter}>Add another linter</Button>
          <Button bsStyle="primary" className="button-right" onClick={this.AddScript}>Add a custom script</Button>
        </ul>
        <br />
        <br />
        <Button type="submit" bsStyle="success" disabled={this.state.submitting}>Save</Button>
        </form>
        <WebHookModal display={this.state.webhookModal} API_ROOT={agent.API_ROOT} onChange={this.handleWebHookModal}/>
      </div>
    ) : null;
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ReposConfig);
