import React from "react";
import { Route, Switch } from "react-router-dom";

import { withAuthGuardStudent } from "../HOCs/authGuards";
import StudentDashboard from "./StudentDashboard";
import Profile from "./Profile";

function StudentIndex() {
  return (
    <Switch>
      <Route path="/student/dashboard" component={StudentDashboard} exact />
      <Route path="/student/profile" component={Profile} exact />
      <Route path="/student/*" component={StudentDashboard} />
    </Switch>
  );
}

export default withAuthGuardStudent(StudentIndex);
