import React from 'react';
import {connect} from 'react-redux';
import Button from 'react-bootstrap/lib/Button';
import Checkbox from 'react-bootstrap/lib/Checkbox';
import agent from '../../agent';


const mapStateToProps = state => ({});

const mapDispatchToProps = dispatch => ({});


class ReposConfig extends React.Component {
  constructor() {
    super();
    this.state = { project: null, linters: null };
    agent.Customers.repos().then(res => {
      const repo = res.repos.filter(project => project.id === Number.parseInt(this.props.params.projectId, 10))[0];
      this.setState({project: repo });
    });
    agent.Linters.all().then(res => {
      this.setState({linters: res});
    });
  }

  render() {
    return this.state.project ? (
      <div>
        <h2>Configuring {this.state.project.full_name}</h2>
        <p>Please choose a linter : </p>
        <ul>
          {this.state.linters.map(linter => <Checkbox key={linter.name}>{linter.name}</Checkbox>)}
        </ul>
        <Button bsStyle="success">Save</Button>
      </div>
    ) : null;
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ReposConfig);
