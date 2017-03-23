import React, {Component} from 'react';
import {Navbar, Nav, NavDropdown, MenuItem} from 'react-bootstrap';
import logo from './logo.png';
import './Header.css';

class Header extends Component {
  render() {
    let adminAccess = null;
    const usersLink = <MenuItem href="/#/app/admin">Users admin</MenuItem>;
    const scriptsLink = <MenuItem href="/#/app/scripts">Scripts admin</MenuItem>;
    if (this.props.currentUser && this.props.currentUser.roles && this.props.currentUser.roles.find(role => {return role.name === 'admin'})) {
      adminAccess = [usersLink, scriptsLink]
    } else {
      adminAccess = '';
    }
    return (
      <Navbar>
        <Navbar.Header>
          <Navbar.Brand>
            <a href="#/app"><img src={logo} className="navbar-left" alt="logo"/>Captain Standard </a>
          </Navbar.Brand>
        </Navbar.Header>
        <Nav className="navbar-right">
          <NavDropdown id="nav-dropdown" title={<span><i className="fa fa-user" /> {this.props.currentUser && this.props.currentUser.username}</span>}>
            <MenuItem onClick={this.props.onLogout}>Logout</MenuItem>
            {adminAccess}
          </NavDropdown>
        </Nav>
      </Navbar>
    );
  }
}

export default Header;
