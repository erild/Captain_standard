import React from 'react';
import Button from 'react-bootstrap/lib/Button';
import agent from '../../agent';
import FormControl from 'react-bootstrap/lib/FormControl';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';


class Admin extends React.Component {
  constructor() {
    super();
    this.state = { customers: [], selectedUser: 'none', actionType: 'Add'};
    agent.Customers.allWithRoles().then(res => this.setState({customers: res}));
    this.handleUserChange = this.handleUserChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleUserChange(event) {
    this.setState({selectedUser: event.target.value})
    if(this.state.customers[event.target.value].roles.find(role => {return role.name == 'admin'})) {
      this.setState({actionType: 'Remove'});
    } else {
      this.setState({actionType: 'Add'});
    }
  }

  handleSubmit(event) {
    if (this.state.actionType == 'Add') {
      agent.Customers.addAdmin(this.state.customers[this.state.selectedUser].id).then(window.location.reload());
    } else {
      agent.Customers.removeAdmin(this.state.customers[this.state.selectedUser].id).then(window.location.reload());
    }
  }

  render() {
    if (this.state.customers.length) {
      return (
        <div>
        <h2>Handle admin access for users</h2>
        <FormControl componentClass="select" placeholder="select user" onChange={this.handleUserChange} value={this.state.selectedUser}>
          <option value='none' key='none'>--</option>
          {this.state.customers.map((customer, index) => <option value={index} key={index}>{customer.username} {customer.roles.find(role => {return role.name == 'admin'}) ? ' (admin)' : ''}</option>)}
        </FormControl>
        <Button onClick={this.handleSubmit}>{this.state.actionType} admin rights</Button>
        </div>
      );
    } else {
      return null;
    }
  }
}

export default Admin;
