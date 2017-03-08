import React from 'react';
import Well from 'react-bootstrap/lib/Well';
import Button from 'react-bootstrap/lib/Button';
import agent from '../../agent';
import ScriptModal from '../ScriptModal';

class ScriptsManager extends React.Component {
  constructor() {
    super();
    this.state = { scripts: [], scriptModal: { name: '', description: '', content: ''}, displayScriptModal: false};
    agent.Customers.scripts().then(res => this.setState({scripts: res}));
    this.activateModalNew = this.activateModalNew.bind(this);
    this.activateModalEdit = this.activateModalEdit.bind(this);
    this.handleScriptModal = this.handleScriptModal.bind(this);
  }

  activateModalNew() {
    this.setState({ displayScriptModal: true, scriptModal: { name: '', description: '', content: ''} })
  }

  activateModalEdit(key) {
    this.setState({ displayScriptModal: true, scriptModal: this.state.scripts[key] })
  }

  handleScriptModal(event) {
    if (event.hasOwnProperty('close')) {
      this.setState({ displayScriptModal: false })
    } else if (event.hasOwnProperty('name') && event.hasOwnProperty('description') && event.hasOwnProperty('content')) {
      let script = event
      agent.Customers.current().then(customer => {
        Object.assign(script, { customerId: customer.id });
        agent.Script.put(event);
        this.setState({ displayScriptModal: false })
      })
    }
  }

  render() {
    if (this.state.scripts) {
      return (
        <div>
        <Button bsStyle="success" onClick={this.activateModalNew}><i className="fa fa-plus"/> Add new script</Button>
        <ul style={{marginTop: '20px'}}>{this.state.scripts.map((script, index) => (
          <Well onClick={() => this.activateModalEdit(index)} key={script.id}>
            <p>{script.name}: {script.description}</p>
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

export default ScriptsManager;
