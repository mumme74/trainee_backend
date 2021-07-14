import React from "react";
import { Route, Switch } from "react-router-dom";

import { withAuthGuardSuperAdmin } from "../HOCs/authGuards";
import SuperAdminDashboard from "./SuperAdminDashboard";

function SuperAdminIndex() {
  return (
    <Switch>
      <Route
        path="/superadmin/dashboard"
        component={SuperAdminDashboard}
        exact
      />
      <Route path="/superadmin/*" component={SuperAdminDashboard} />
    </Switch>
  );
}

export default withAuthGuardSuperAdmin(SuperAdminIndex);
