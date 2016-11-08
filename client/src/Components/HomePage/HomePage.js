import React from "react";
import {connect} from "react-redux";

const mapStateToProps = state => ({
  currentUser: state.auth.currentUser
});

const mapDispatchToProps = dispatch => ({});

class HomePage extends React.Component {
  render() {
    return this.props.currentUser ? <h1>Hey {this.props.currentUser && this.props.currentUser.username }</h1> : null;
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(HomePage);
