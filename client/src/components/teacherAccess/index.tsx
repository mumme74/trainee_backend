import React from "react";
import { Route, Switch } from "react-router-dom";

import { withAuthGuardTeacher } from "../HOCs/authGuards";
import TeacherDashboard from "./TeacherDashboard";

function TeacherIndex() {
  return (
    <Switch>
      <Route path="/teacher/dashboard" component={TeacherDashboard} exact />
      <Route path="/teacher/*" component={TeacherDashboard} />
    </Switch>
  );
}

export default withAuthGuardTeacher(TeacherIndex);
