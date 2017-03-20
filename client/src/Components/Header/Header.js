import React, {Component} from 'react';
import {Navbar, Nav, NavDropdown, MenuItem} from 'react-bootstrap';
import logo from './logo.png';
import './Header.css';

class Header extends Component {
  render() {
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
            <MenuItem href="/#/app/admin">Admin</MenuItem>
          </NavDropdown>
        </Nav>
      </Navbar>
    );
  }
}

export default Header;
