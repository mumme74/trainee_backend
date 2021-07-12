import React from "react";
import { Route, Switch } from "react-router-dom";

import authGuard from "../HOCs/authGuard";
import DashboardStudent from "./DashboardStudent";
import Profile from "./Profile";

export default function () {
  return (
    <Switch>
      <Route
        path="/student/dashboard"
        component={authGuard(DashboardStudent)}
        exact
      />
      <Route path="/student/profile" component={authGuard(Profile)} exact />
      <Route path="/student/*" component={authGuard(DashboardStudent)} />
    </Switch>
  );
}
