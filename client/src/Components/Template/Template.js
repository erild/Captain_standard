import React, {Component} from 'react';
import Header from '../Header';
import {connect} from 'react-redux';

const mapStateToProps = state => ({...state.auth});

const mapDispatchToProps = dispatch => ({
  onLogout: () => dispatch({type: 'LOGOUT'})
});

class Template extends Component {
  render() {
    if (this.props.redirecting) {
      return <h4>Redirecting to auth...</h4>;
    }
    return (
      <div>
        <Header currentUser={this.props.currentUser} onLogout={this.props.onLogout}/>
        <div className="container">
          {this.props.children}
        </div>
      </div>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Template);
