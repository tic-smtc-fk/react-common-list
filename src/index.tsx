import { HashRouter as Router, Route, Switch } from 'react-router-dom';
import React from 'react';
import ReactDOM from 'react-dom';

import './index.less';
import { List } from './ProdList';

function App() {
  return (
    <Router>
      <Switch>
        <Route path="/">
          <List />
        </Route>
      </Switch>
    </Router>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
