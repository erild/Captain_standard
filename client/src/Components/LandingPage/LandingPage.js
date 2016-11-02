import React, {Component} from 'react';
import logo from './splash.png';
import './LandingPage.css';
import Jumbotron from 'react-bootstrap/lib/Jumbotron';
import Button from 'react-bootstrap/lib/Button';

export default class LandingPage extends Component {
  render() {
    return (
      <Jumbotron>
        <div className="landing-page container">
          <div className="pull-left">
            <h1>Captain Standard</h1>
            <h4 className="subText"> Your key-partner to fight code style issues</h4>
            <br />
            <Button bsStyle="success">Let's kick some code</Button>
          </div>
          <img src={logo} className="splash" alt="superhero drawing"/>

        </div>
      </Jumbotron>
    );
  }
}
