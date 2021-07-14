import React from "react";
import { Route, Switch } from "react-router-dom";

import { withAuthGuardAdmin } from "../HOCs/authGuards";
import AdminUsers from "./AdminUsers";
import AdminDashboard from "./AdminDashboard";

function AdminIndex() {
  return (
    <Switch>
      <Route path="/admin/users" component={AdminUsers} exact />
      <Route path="/admin/*" component={AdminDashboard} />
    </Switch>
  );
}

export default withAuthGuardAdmin(AdminIndex);
