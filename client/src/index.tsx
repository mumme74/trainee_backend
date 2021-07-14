import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter, Switch, Route } from "react-router-dom";
import { Provider } from "react-redux";

import App from "./components/App";
import Home from "./components/Home";
import Dashboard from "./components/Dashboard";
import SignUp from "./components/login/SignUp";
import Login from "./components/login/Login";
import { withAuthGuardStudent } from "./components/HOCs/authGuards";
import { initStore } from "./redux/store";
import Unauthorized from "./components/Unauthorized";
import Student from "./components/studentAccess";
import About from "./components/About";
import { initAxios } from "./axiosCommon";
import DeleteMe from "./components/login/DeleteMe";

const store = initStore();
initAxios();

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App>
          <Switch>
            <Route path="/dashboard" component={Dashboard} exact />
            <Route path="/signup" component={SignUp} exact />
            <Route path="/login" component={Login} exact />
            <Route path="/unauthorized" component={Unauthorized} exact />
            <Route path="/student" component={withAuthGuardStudent(Student)} />
            <Route
              path="/deleteme"
              component={withAuthGuardStudent(DeleteMe)}
            />
            <Route path="/about" component={About} exact />
            <Route path="/*" component={Home} />
          </Switch>
        </App>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
  document.getElementById("root")
);
