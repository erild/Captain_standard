import React from 'react';
import {connect} from 'react-redux';
import Button from 'react-bootstrap/lib/Button';

const mapStateToProps = state => ({
  currentUser: state.auth.currentUser
});

const mapDispatchToProps = dispatch => ({});

class HomePage extends React.Component {
  render() {
    if (this.props.currentUser) {
        return (
          <div>
            <h1>Hey {this.props.currentUser && this.props.currentUser.username }</h1>
            <Button bsStyle="success" href="/#/app/repos"><i className="fa fa-plus"/> Add a project</Button>
          </div>
        );
    } else {
        return null;
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(HomePage);
