import React from 'react';
import {connect} from 'react-redux';
import {browserHistory} from 'react-router';
import Button from 'react-bootstrap/lib/Button';
import agent from '../../agent';
import FeatureConfig from '../FeatureConfig';
import ScriptConfig from '../ScriptConfig';
import './ReposConfig.css';
import {MarkGithubIcon} from 'react-octicons';


const mapStateToProps = state => ({...state.projects});

const mapDispatchToProps = dispatch => ({
  onLoad: (id) =>
    agent.Project.get(id).then(res => dispatch({type: 'FETCH_PROJECT', payload: res}))
});


class ReposConfig extends React.Component {
  constructor() {
    super();
    this.state = {
      linters: null,
      configCmds: null,
      customScripts: null,
      projectConfigCmds: null,
      projectLinters: null,
      projectScripts: null,
      submitting: false
    };
    agent.Linters.all().then(res => this.setState({linters: res}));
    agent.Script.all().then(res => this.setState({customScripts: res}));
    agent.ConfigCmds.all().then(res => this.setState({configCmds: res}));
    this.handleLinterChange = this.handleLinterChange.bind(this);
    this.handleConfigCmdChange = this.handleConfigCmdChange.bind(this);
    this.handleScriptChange = this.handleScriptChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.AddLinter = this.AddLinter.bind(this);
    this.AddScript = this.AddScript.bind(this);
    this.AddConfigCmd = this.AddConfigCmd.bind(this);
  }

  componentWillMount() {
    this.props.onLoad(this.props.params.projectId).then(() => {
      agent.Project.getProjectLinters(this.props.project.id).then(res => this.setState({projectLinters: res}));
      agent.Project.getProjectScripts(this.props.project.id).then(res => this.setState({projectScripts: res}));
      agent.Project.getProjectConfigCmds(this.props.project.id).then(res => this.setState({projectConfigCmds: res}));
    });
  }

  handleLinterChange(linterInfo, key) {
    let projectLinters = this.state.projectLinters;
    linterInfo === 'delete' ? projectLinters.splice(key, 1) : projectLinters[key] = Object.assign(projectLinters[key], linterInfo);
    this.setState({projectLinters});
  }

  handleConfigCmdChange(configCmdInfo, key) {
    let projectConfigCmds = this.state.projectConfigCmds;
    configCmdInfo === 'delete' ? projectConfigCmds.splice(key, 1) : projectConfigCmds[key] = Object.assign(projectConfigCmds[key], configCmdInfo);
    this.setState({projectConfigCmds});
  }

  handleScriptChange(scriptInfo, key) {
    if(scriptInfo === 'update') {
      agent.Script.all().then(res => {
        this.setState({customScripts: res});
        if (res.length) {
          let projectScripts = this.state.projectScripts;
          Object.assign(projectScripts[key], { scriptId: res[res.length-1].id });
          this.setState({ projectScripts })
        }
      });
    } else {
      let projectScripts = this.state.projectScripts;
      scriptInfo === 'delete' ? projectScripts.splice(key, 1) : projectScripts[key] = Object.assign(projectScripts[key], scriptInfo);
      this.setState({projectScripts});
    }
  }

  handleSubmit(event) {
    this.setState({submitting: true});
    let user;
    let project;
    Promise.all([
      agent.Customers.current(),
      agent.Project.put(this.props.project.fullName, this.props.project.id, this.props.project.cloneUrl),
    ]).then(res => {
        user = res[0];
        project = res[1];
        return Promise.all([
          agent.Project.linkCustomer(project.id, user.id),
          agent.Project.updateAllRel(project.id, this.state.projectLinters, this.state.projectScripts, this.state.projectConfigCmds),
        ]);
    }).then(() => {
      browserHistory.push('/#/app');
      window.location.reload();
    }).catch(() => {
      this.setState({submitting: false});
    });
    event.preventDefault();
  }

  AddLinter() {
    let projectLinters = this.state.projectLinters;
    projectLinters.push({projectId: this.props.project.id, linterId: 1, directory: "/"});
    this.setState({projectLinters});
  }

  AddConfigCmd() {
    let projectConfigCmds = this.state.projectConfigCmds;
    projectConfigCmds.push({projectId: this.props.project.id, configCmdId: 1, directory: "/"});
    this.setState({projectConfigCmds});
  }

  AddScript() {
    let projectScripts = this.state.projectScripts;
    this.state.customScripts.length ? projectScripts.push({
        projectId: this.props.project.id,
        scriptId: this.state.customScripts[0].id,
        directory: "/"
      }) : projectScripts.push({projectId: this.props.project.id, scriptId: null, directory: ""})
    this.setState({projectScripts: projectScripts});
  }

  render() {

    return this.props.project && this.state.linters && this.state.customScripts && this.state.projectLinters && this.state.projectScripts && this.state.projectConfigCmds ? (
      <div>
        <h2>Configuring {this.props.project.fullName} <a href={'https://github.com/' + this.props.project.fullName}
                                                         target="_blank"><MarkGithubIcon size="mega"
                                                                                         className="octocat"/></a></h2>
        <form onSubmit={this.handleSubmit}>
          <p>Please choose a command to initialize the project :
            <Button bsStyle="primary" style={{marginLeft: '10px'}} onClick={this.AddConfigCmd}>Add a config command</Button>
          </p>
          <ul>
            {this.state.projectConfigCmds.map((projectConfigCmd, key) => {
              return (
                <FeatureConfig features={this.state.configCmds} featureName="configCmd"
                               selectedFeature={projectConfigCmd.configCmdId} directory={projectConfigCmd.directory} key={key}
                               onChange={event => this.handleConfigCmdChange(event, key)}/>
              )
            })}
          </ul>
          <p>Please choose a linter : </p>
          <ul>
            {this.state.projectLinters.map((projectLinter, key) => {
              return (
                <FeatureConfig features={this.state.linters} featureName="linter" selectedFeature={projectLinter.linterId}
                               directory={projectLinter.directory} key={key}
                               onChange={event => this.handleLinterChange(event, key)}/>
              )
            })}
            {this.state.projectScripts.map((projectScript, key) => {
              return (
                <ScriptConfig scripts={this.state.customScripts} selectedScript={projectScript.scriptId}
                              directory={projectScript.directory} key={key}
                              onChange={event => this.handleScriptChange(event, key)}/>
              )
            })}
            <Button bsStyle="primary" className="button-left" onClick={this.AddLinter}>Add another linter</Button>
            <Button bsStyle="primary" className="button-right" onClick={this.AddScript}>Add a custom script</Button>
          </ul>
          <br />
          <br />
          <Button type="submit" bsStyle="success" disabled={this.state.submitting}>Save</Button>
        </form>
      </div>
    ) : null;
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ReposConfig);
