import React from 'react';
import {Link} from 'react-router';
import Well from 'react-bootstrap/lib/Well';

class ProjectsList extends React.Component {
  render() {
    if (this.props.projects.length) {
      return (
        <ul style={{marginTop: '20px'}}>{this.props.projects.map((project, index) => (
          <Well key={project.id}>
            <Link to={`/app/projects/${project.id}/edit`}>{project.full_name}</Link>
            {project.configured || this.props.configured || <span>(Projet non configuré)</span>}
          </Well>
        ))}</ul>
      );
    } else {
      return null;
    }
  }
}

export default ProjectsList;
