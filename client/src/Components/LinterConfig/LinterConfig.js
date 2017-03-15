import React from 'react';
import FormControl from 'react-bootstrap/lib/FormControl';
import Well from 'react-bootstrap/lib/Well';
import Button from 'react-bootstrap/lib/Button';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';

class LinterConfig extends React.Component {
  constructor(props) {
    super(props);
    this.handleLinterChange = this.handleLinterChange.bind(this);
    this.handleLinterDirChange = this.handleLinterDirChange.bind(this);
    this.handleRemove = this.handleRemove.bind(this);
  }

  handleLinterChange(event) {
    this.props.onChange({linterId: Number(event.target.value), directory: this.props.directory});
  }

  handleLinterDirChange(event) {
    this.props.onChange({linterId: this.props.selectedLinter, directory: event.target.value});
  }

  handleRemove() {
    this.props.onChange('delete');
  }

  render() {
    return (
      <Well>
        <FormControl componentClass="select" placeholder="select linter" onChange={this.handleLinterChange} value={this.props.selectedLinter}>
          {this.props.linters.map(linter => <option value={linter.id} key={linter.id}>{linter.name}</option>)}
        </FormControl>
        <FormControl type="text" placeholder="Directory" onChange={this.handleLinterDirChange} value={this.props.directory} key={this.props.id+"_dir"} />
        <Button onClick={this.handleRemove}><Glyphicon glyph="remove" /></Button>
      </Well>
    );
  }
}

export default LinterConfig;
