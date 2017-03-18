import React, {Component} from "react";
import {Alert} from "react-bootstrap";
import {connect} from 'react-redux';
import config from '../../config';

const mapStateToProps = state => ({errors: state.errors });
const mapDispatchToProps = dispatch => ({
  onDismiss: (index) => dispatch({type: 'REMOVE_ERROR', payload: index})
});

class ErrorAlert extends Component {
  render() {
    if (this.props.errors) {
      return (<div>
        {this.props.errors.map((error, index) => (
        <Alert bsStyle="danger" key={index} onDismiss={() => this.props.onDismiss(index)}>
          <p>{error.message}</p>
          {error.status === 400 ? (<p>Click <a href={config.INSTALLATION_LINK} target="_blank">here</a> to install the integration.</p>) : '' }
        </Alert>
      ))}
      </div>);
    } else {
      return null;
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ErrorAlert);
