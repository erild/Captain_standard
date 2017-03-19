import React from 'react';
import FormControl from 'react-bootstrap/lib/FormControl';
import Well from 'react-bootstrap/lib/Well';
import Button from 'react-bootstrap/lib/Button';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';

class FeatureConfig extends React.Component {
  constructor(props) {
    super(props);
    this.handleFeatureChange = this.handleFeatureChange.bind(this);
    this.handleFeatureDirChange = this.handleFeatureDirChange.bind(this);
    this.handleRemove = this.handleRemove.bind(this);
  }

  handleFeatureChange(event) {
    this.props.onChange({[this.props.featureName + 'Id']: Number(event.target.value), directory: this.props.directory});
  }

  handleFeatureDirChange(event) {
    this.props.onChange({[this.props.featureName + 'Id']: this.props.selectedFeature, directory: event.target.value});
  }

  handleRemove() {
    this.props.onChange('delete');
  }

  render() {
    return (
      <Well>
        <FormControl componentClass="select" placeholder={`select ${this.props.featureName}`} onChange={this.handleFeatureChange} value={this.props.selectedFeature}>
          {this.props.features.map(feature => <option value={feature.id} key={feature.id}>{feature.name}</option>)}
        </FormControl>
        <FormControl type="text" placeholder="Directory (must exists on master branch)" onChange={this.handleFeatureDirChange} value={this.props.directory} key={this.props.id+"_dir"} />
        <Button onClick={this.handleRemove}><Glyphicon glyph="remove" /></Button>
      </Well>
    );
  }
}

export default FeatureConfig;
