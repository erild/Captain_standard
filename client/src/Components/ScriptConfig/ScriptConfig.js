import React from 'react';
import FormControl from 'react-bootstrap/lib/FormControl';
import Well from 'react-bootstrap/lib/Well';
import Button from 'react-bootstrap/lib/Button';
import agent from '../../agent';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';

class ScriptConfig extends React.Component {
  constructor(props) {
    super(props);
    this.handleScriptDirChange = this.handleScriptDirChange.bind(this);
    this.handleScriptIdChange = this.handleScriptIdChange.bind(this);
    this.handleRemove = this.handleRemove.bind(this);
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

  render() {
    if(this.props.scripts && this.props.scripts.length) {
      return (
        <Well>
          <FormControl componentClass="select" placeholder="select linter" onChange={this.handleScriptIdChange} value={this.props.selectedScript}>
            {this.props.scripts.map(script => <option value={script.id} key={script.id}>{script.name}</option>)}
          </FormControl>
          <FormControl type="text" placeholder="Directory" onChange={this.handleScriptDirChange} value={this.props.directory} key={this.props.id+"_dir"} />
          <Button onClick={this.handleRemove}><Glyphicon glyph="remove" /></Button>
        </Well>
      );
    } else {
        return null;
    }
  }
}

export default ScriptConfig;
