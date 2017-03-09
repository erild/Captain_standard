import React from 'react';
import {connect} from 'react-redux';
import './ReposManager.css';
import ProjectsList from '../ProjectsList';
import agent from '../../agent';
import Pagination from 'react-bootstrap/lib/Pagination';
import Button from 'react-bootstrap/lib/Button';
import FormControl from 'react-bootstrap/lib/FormControl';
import Form from 'react-bootstrap/lib/Form';
import FormGroup from 'react-bootstrap/lib/FormGroup';
import InputGroup from 'react-bootstrap/lib/InputGroup';


const mapStateToProps = state => ({...state.repos});

const mapDispatchToProps = dispatch => ({
  onLoad: () => dispatch({type: 'FETCH_REPOS', payload: agent.Customers.repos(1)}),
  onSetPage: (page) => dispatch({type: 'FETCH_REPOS', payload: agent.Customers.repos(page)})
});


class ReposManager extends React.Component {
  constructor(props) {
    super(props);
    this.state = {fullName: '', loading: false};
  }

  componentWillMount() {
    this.props.onLoad();
    this.handleSelect = this.handleSelect.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  handleSelect(eventKey) {
    this.props.onSetPage(eventKey);
    window.scrollTo(0, 0);
  }

  handleSubmit(event) {
    event.preventDefault();
    this.setState({loading: true});
    agent.Project
      .getProjectInstallation(this.state.fullName)
      .then(res => {
        res.length && this.context.router.push(`/app/projects/${res[0].projectId}/edit`);
      })
      .catch(() => this.setState({loading: false}));
  }

  handleChange(event) {
    this.setState({fullName: event.target.value})
  }

  render() {
    if (this.props.projects) {
      return <div>
        <p style={{ paddingLeft: '40px', paddingTop: '7px', float: 'left'}}>Private repos are not listed here. Use following textbox to add a private repo :</p>
        <Form onSubmit={this.handleSubmit}>
          <FormGroup>
            <InputGroup style={{maxWidth: '400px', paddingLeft: '40px'}}>
          <FormControl type="text" value={this.state.fullName} onChange={this.handleChange} placeholder="username/private-repo" />
          <InputGroup.Button><Button type="submit" disabled={this.state.loading} onClick={this.handleSubmit}>Search</Button></InputGroup.Button>
            </InputGroup>
          </FormGroup>
        </Form>
        <ProjectsList projects={this.props.projects} />
      <Pagination
        prev
        next
        first
        last
        ellipsis
        boundaryLinks
        items={this.props.pageLast}
        maxButtons={3}
        activePage={this.props.pageCurrent}
        onSelect={this.handleSelect} /></div>;
    }
    return <span>Loading projects...</span>;
  }
}
ReposManager.contextTypes = {
  router: React.PropTypes.object
}
export default connect(mapStateToProps, mapDispatchToProps)(ReposManager);
