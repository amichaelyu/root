import React from 'react';
import { Route, Switch, Redirect } from 'react-router-dom';
import { RoutedTabs, NavTab } from 'react-router-tabs';
 
import 'react-router-tabs/styles/react-router-tabs.scss';
import Stats from './Stats';
import AdminTable from './AdminTable';
 
const Admin = ({ match }) => {
  return (
    <div className="bg-white col-8 offset-2 p-4">
      <NavTab to={`${match.path}/table`}>Application Table</NavTab>
      <NavTab to={`${match.path}/stats`}>View Stats</NavTab>
      <NavTab to={`${match.path}/change_status`}>Bulk change status</NavTab>
       
      <Switch>
        <Route exact path={`${match.path}`} render={() => <Redirect replace to={`${match.path}/table`} />} />
        <Route path={`${match.path}/table`} component={AdminTable} />
        <Route path={`${match.path}/stats`} component={Stats} />
        {/* <Route path={`${match.path}/users`} component={Users} /> */}
      </Switch>
    </div>
  );
};
 
export default Admin;