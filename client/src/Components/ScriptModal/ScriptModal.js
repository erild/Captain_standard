import React from 'react';
import Modal from 'react-bootstrap/lib/Modal';
import Button from 'react-bootstrap/lib/Button';
import FormControl from 'react-bootstrap/lib/FormControl';
import ControlLabel from 'react-bootstrap/lib/ControlLabel';

class ScriptModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = { scriptObject: { name: '', description: '', content: 'return {fileComments: [], globalComments: []};'} };
    this.close = this.close.bind(this);
    this.handleNameChange = this.handleNameChange.bind(this);
    this.handleDescriptionChange = this.handleDescriptionChange.bind(this);
    this.handleContentChange = this.handleContentChange.bind(this);
    this.handleFileUploaded = this.handleFileUploaded.bind(this);
    this.saveScript = this.saveScript.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    this.state = { scriptObject: nextProps.script };
  }

  close() {
    this.props.onChange({close: true});
  }

  handleNameChange(event) {
    const script = this.state.scriptObject;
    script.name = event.target.value;
    this.setState({ scriptObject: script });
  }

  handleDescriptionChange(event) {
    const script = this.state.scriptObject;
    script.description = event.target.value;
    this.setState({ scriptObject: script });
  }

  handleContentChange(event) {
    const script = this.state.scriptObject;
    script.content = event.target.value;
    this.setState({ scriptObject: script });
  }

  handleFileUploaded(event) {
    const reader  = new FileReader();
    reader.onload = function(output) {
      let script = this.state.scriptObject;
      script.content = output.target.result;
      this.setState({ scriptObject: script });
    }.bind(this);
    reader.readAsText(event.target.files[0]);
  }

  saveScript() {
    this.props.onChange(this.state.scriptObject);
  }

  render() {
    return (
      <Modal show={this.props.display} onHide={this.close}>
        <Modal.Header closeButton>
          <Modal.Title>Custom Script</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Write a JavaScript function to do custom evaluation of the code</p>
          <p>The function can use one variable, <code>dir</code>, which is a string representing the absolute path to the directory to lint.</p>
          <p>The output should be of the following format, with two arrays, <code>fileComments</code> and <code>globalComments</code> : </p>
          <pre>
{`{ fileComments: [
            { filePath: fileName,
              messages: [
                { message: message,
                  line: lineNumber,
                  severity: severity (1 for warning, 2 for error),
                  ruleId: ruleBroken
                },
                ...],
          },
          ...],
          globalComments:  [
            { message: message,
              severity: severity (1 for warning, 2 for error)
            },
            ...]
          }`}
          </pre>
          <ControlLabel>Name</ControlLabel>
          <FormControl type="text" placeholder="name" onChange={this.handleNameChange} value={this.state.scriptObject.name}/>
          <ControlLabel>Description</ControlLabel>
          <FormControl type="text" placeholder="description" onChange={this.handleDescriptionChange} value={this.state.scriptObject.description}/>
          <ControlLabel>Script</ControlLabel>
          <p>Upload content of the function here or type it below</p>
          <FormControl type="file" label="File" accept='.js' onChange={this.handleFileUploaded}/>
          <FormControl componentClass="textarea" style={{ height: 200 }} onChange={this.handleContentChange} value={this.state.scriptObject.content}/>
          <br />
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.saveScript}>Save custom script</Button>
          <Button onClick={this.close}>Close</Button>
        </Modal.Footer>
      </Modal>
    );
  }
}

export default ScriptModal;
