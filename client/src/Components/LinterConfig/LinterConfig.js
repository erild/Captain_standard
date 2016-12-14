import React from 'react';
import FormControl from 'react-bootstrap/lib/FormControl';
import Well from 'react-bootstrap/lib/Well';
import Button from 'react-bootstrap/lib/Button';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';

class LinterConfig extends React.Component {
  constructor(props) {
    super(props);
    this.handleLinterDirChange = this.handleLinterDirChange.bind(this);
    this.handleLinterArgChange = this.handleLinterArgChange.bind(this);
    this.handleRemove = this.handleRemove.bind(this);
  }

  handleLinterDirChange(event) {
    this.props.onChange({linterId: this.props.selectedLinter, directory: event.target.value, arguments: this.props.arguments});
  }

  handleLinterArgChange(event) {
    this.props.onChange({linterId: this.props.selectedLinter, directory: this.props.directory, arguments: event.target.value});
  }

  handleRemove() {
    this.props.onChange('delete');
  }

  render() {
    return (
      <Well>
        <FormControl componentClass="select" placeholder="select linter">
          {this.props.linters.map(linter => <option value={linter.id} key={linter.id}>{linter.name}</option>)}
        </FormControl>
        <FormControl type="text" placeholder="Directory" onChange={this.handleLinterDirChange} value={this.props.directory} key={this.props.id+"_dir"} />
        <FormControl type="text" placeholder="Arguments" onChange={this.handleLinterArgChange} value={this.props.arguments} key={this.props.id+"_arg"} />
        <Button onClick={this.handleRemove}><Glyphicon glyph="remove" /></Button>
      </Well>
    );
  }
}

export default LinterConfig;
