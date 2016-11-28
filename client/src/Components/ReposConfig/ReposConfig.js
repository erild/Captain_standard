import React from 'react';
import {connect} from 'react-redux';
import Button from 'react-bootstrap/lib/Button';


const mapStateToProps = state => ({
  currentUser: state.auth.currentUser
});

const mapDispatchToProps = dispatch => ({});


class ReposConfig extends React.Component {
  render() {
    return (
      <div>
        <h2>This is a configuration page</h2>
        <span>Project ID: {this.props.params.projectId} </span>
        <br/>
        <Button bsStyle="success">Save</Button>
      </div>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ReposConfig);
