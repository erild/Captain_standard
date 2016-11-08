import React from 'react';
import ReactDOM from 'react-dom';
import HomePage from './HomePage';
import {Provider} from 'react-redux';
import store from '../../store';

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<Provider store={store} ><HomePage /></Provider>, div);
});
