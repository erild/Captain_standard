import React from 'react';
import {connect} from 'react-redux';
import Button from 'react-bootstrap/lib/Button';
import Well from 'react-bootstrap/lib/Well';
import ScriptModal from '../ScriptModal';
import agent from '../../agent';
import store from '../../store';

const mapStateToProps = state => ({
  currentUser: state.auth.currentUser
});

class ScriptsManager extends React.Component {
  constructor() {
    super();
    this.state = { scripts: [], scriptModal: { name: '', description: '', content: 'return {fileComments: [], globalComments: []};'}, displayScriptModal: false};
    agent.Script.all().then(res => this.setState({scripts: res}));
    this.activateModalNew = this.activateModalNew.bind(this);
    this.activateModalEdit = this.activateModalEdit.bind(this);
    this.handleScriptModal = this.handleScriptModal.bind(this);
    this.deleteScript = this.deleteScript.bind(this);
  }

  componentWillMount() {
    if (!this.props.currentUser || !this.props.currentUser.roles || !this.props.currentUser.roles.find(role => {return role.name === 'admin'})) {
      store.dispatch({type: 'ADD_ERROR', payload: Error('Access denied')});
    }
  }

  activateModalNew() {
    this.setState({ displayScriptModal: true, scriptModal: { name: '', description: '', content: 'return {fileComments: [], globalComments: []};'} })
  }

  activateModalEdit(key) {
    this.setState({ displayScriptModal: true, scriptModal: this.state.scripts[key] })
  }

  handleScriptModal(event) {
    if (event.hasOwnProperty('close')) {
      this.setState({ displayScriptModal: false })
    } else if (event.hasOwnProperty('name') && event.hasOwnProperty('description') && event.hasOwnProperty('content')) {
      const script = event;
      agent.Customers.current().then(customer => {
        Object.assign(script, { customerId: customer.id });
        agent.Script
          .put(script)
          .then(() => agent.Script.all())
          .then(res => this.setState({scripts: res, displayScriptModal: false}));
      });
    }
  }

  deleteScript(event, script, index) {
    event.stopPropagation();
    if (confirm(`Êtes-vous sûr de vouloir supprimer le script ${script.name} de Captain Standard?`)) {
      agent.Script.del(script.id).then(() =>
        this.setState(state => {
          state.scripts.splice(index, 1);
          return {scripts: state.scripts};
        })
      );
    }
  };

  render() {
    if (this.props.currentUser && this.props.currentUser.roles && this.props.currentUser.roles.find(role => {return role.name === 'admin'}) && this.state.scripts) {
      return (
        <div>
        <Button bsStyle="success" onClick={this.activateModalNew}><i className="fa fa-plus"/> Add new script</Button>
        <ul style={{marginTop: '20px'}}>{this.state.scripts.map((script, index) => (
          <Well onClick={() => this.activateModalEdit(index)} key={script.id}>
            <p>{script.name}: {script.description}</p>
            <Button bsStyle="danger" onClick={(e) => this.deleteScript(e, script, index)}><i className="fa fa-trash"/></Button>
          </Well>
        ))}
        </ul>
        <ScriptModal script={this.state.scriptModal} display={this.state.displayScriptModal} onChange={this.handleScriptModal}/>
        </div>
      );
    } else {
      return null;
    }
  }
}

export default connect(mapStateToProps)(ScriptsManager);
