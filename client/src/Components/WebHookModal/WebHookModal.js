import React from 'react';
import Modal from 'react-bootstrap/lib/Modal';
import Button from 'react-bootstrap/lib/Button';
import FormControl from 'react-bootstrap/lib/FormControl';

class WebHookModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = { secret: '' };
    this.close = this.close.bind(this);
    this.handleSecretChange = this.handleSecretChange.bind(this);
    this.saveSecret = this.saveSecret.bind(this);
  }

  close() {
    this.props.onChange('close');
  }

  handleSecretChange(event) {
    this.setState({ secret: event.target.value });
  }

  saveSecret() {
    this.props.onChange({ secret: this.state.secret });
  }

  render() {
    return (
      <Modal show={this.props.display} onHide={this.close}>
        <Modal.Header closeButton>
          <Modal.Title>GitHub WebHook</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Please contact the project owner to add a webhook with the following configuration:</p>
          <ul>
            <li>Payload URL: <code>{this.props.API_ROOT}/Projects/linters-exec</code></li>
            <li>Content type: <code>application/json</code></li>
            <li>Trigger on pull request</li>
            <li>A secret of your chosing</li>
          </ul>

          <p>When you have added the webhook, please save the configuration again and enter the secret here</p>
          <FormControl type="text" placeholder="Secret" onChange={this.handleSecretChange} value={this.state.secret}/>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.saveSecret}>Save Webhook secret</Button>
          <Button onClick={this.close}>Close</Button>
        </Modal.Footer>
      </Modal>
    );
  }
}

export default WebHookModal;
