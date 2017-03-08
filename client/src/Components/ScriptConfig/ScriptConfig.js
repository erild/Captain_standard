import React from 'react';
import FormControl from 'react-bootstrap/lib/FormControl';
import Well from 'react-bootstrap/lib/Well';
import Button from 'react-bootstrap/lib/Button';
import agent from '../../agent';
import ScriptModal from '../ScriptModal';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';

class ScriptConfig extends React.Component {
  constructor(props) {
    super(props);
    this.state = { newScript: false };
    this.handleScriptDirChange = this.handleScriptDirChange.bind(this);
    this.handleScriptIdChange = this.handleScriptIdChange.bind(this);
    this.handleScriptModal = this.handleScriptModal.bind(this);
    this.handleRemove = this.handleRemove.bind(this);
    this.handleNew = this.handleNew.bind(this);
  }

  handleScriptDirChange(event) {
    this.props.onChange({scriptId: this.props.selectedScript, directory: event.target.value});
  }

  handleScriptIdChange(event) {
    this.props.onChange({scriptId: event.target.value, directory: this.props.directory});
  }

  handleRemove() {
    this.props.onChange('delete');
  }

  handleNew() {
    this.setState({ newScript: true })
  }

  handleScriptModal(event) {
    if (event.hasOwnProperty('close')) {
      this.setState({ newScript: false })
      if (!this.props.scripts){
        this.props.onChange('delete');
      }
    } else if (event.hasOwnProperty('name') && event.hasOwnProperty('description') && event.hasOwnProperty('content')) {
      let script = event
      agent.Customers.current().then(customer => {
        Object.assign(script, { customerId: customer.id });
        agent.Script.put(event).then(() => this.props.onChange('update'));
        this.setState({ newScript: false })
      })
    }
  }

  render() {
    if(this.props.scripts && this.props.scripts.length && !this.state.newScript) {
      return (
        <Well>
          <FormControl componentClass="select" placeholder="select linter" onChange={this.handleScriptIdChange} value={this.props.selectedScript}>
            {this.props.scripts.map(script => <option value={script.id} key={script.id}>{script.name}</option>)}
          </FormControl>
          <FormControl type="text" placeholder="Directory" onChange={this.handleScriptDirChange} value={this.props.directory} key={this.props.id+"_dir"} />
          <Button onClick={this.handleNew}><Glyphicon glyph="plus" />New</Button>
          <Button onClick={this.handleRemove}><Glyphicon glyph="remove" /></Button>
        </Well>
      );
    } else {
        return (
          <ScriptModal script={this.state.scriptModal} display={true} onChange={this.handleScriptModal}/>
        );
    }
  }
}

export default ScriptConfig;
