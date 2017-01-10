import React from 'react';
import Modal from 'react-bootstrap/lib/Modal';
import Button from 'react-bootstrap/lib/Button';

class WebHookModal extends React.Component {
  constructor(props) {
    super(props);
    this.close = this.close.bind(this);
  }

  close() {
    this.props.onChange('close');
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
          </ul>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.close}>Close</Button>
        </Modal.Footer>
      </Modal>
    );
  }
}

export default WebHookModal;
