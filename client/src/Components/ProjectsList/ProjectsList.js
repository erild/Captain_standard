import React from 'react';
import {Link} from 'react-router';
import Well from 'react-bootstrap/lib/Well';
import Label from 'react-bootstrap/lib/Label';
import Button from 'react-bootstrap/lib/Button';
import './ProjectsList.css';
import agent from '../../agent';
import {MarkGithubIcon} from 'react-octicons';

class ProjectsList extends React.Component {
  static deleteProject(projectId) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce projet de Captain Standard?')) {
      agent.Project.delete(projectId).then(() => {
        window.location.reload();
      });
    }
  };

  render() {
    if (this.props.projects.length) {
      return (
        <ul className="projects-list">{this.props.projects.map((project, index) => (
          <Well key={project.id}>
            <Link to={`/app/projects/${project.id}/edit`}>{project.fullName || project.full_name}</Link>
            {project.configured || this.props.configured ? (
              <span>
                {project.installationId ? '' : (
                <Label  bsStyle="danger" title="Please check repo exists on Github and Captain Standard has access to it through the integration">
                  Integration not installed
                </Label>
                  )}
                <a href={'https://github.com/' + (project.fullName || project.full_name)} target="_blank"><MarkGithubIcon className="octocat" /></a>
                <Button bsStyle="danger" onClick={() => ProjectsList.deleteProject(project.id)}><i className="fa fa-trash"/></Button>
              </span>
              ) : <span> (Projet non configuré)</span>}
          </Well>
        ))}</ul>
      );
    } else {
      return null;
    }
  }
}

export default ProjectsList;
