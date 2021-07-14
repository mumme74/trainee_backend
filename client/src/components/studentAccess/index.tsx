import React from "react";
import { Route, Switch } from "react-router-dom";

import { withAuthGuardStudent } from "../HOCs/authGuards";
import DashboardStudent from "./DashboardStudent";
import Profile from "./Profile";

function StudentIndex() {
  return (
    <Switch>
      <Route
        path="/student/dashboard"
        component={withAuthGuardStudent(DashboardStudent)}
        exact
      />
      <Route
        path="/student/profile"
        component={withAuthGuardStudent(Profile)}
        exact
      />
      <Route
        path="/student/*"
        component={withAuthGuardStudent(DashboardStudent)}
      />
    </Switch>
  );
}

export default withAuthGuardStudent(StudentIndex);
