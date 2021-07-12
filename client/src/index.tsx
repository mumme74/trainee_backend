import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter, Switch, Route } from "react-router-dom";
import { Provider } from "react-redux";

import App from "./components/App";
import Home from "./components/Home";
import Dashboard from "./components/Dashboard";
import SignUp from "./components/login/SignUp";
import Login from "./components/login/Login";
import authGuard from "./components/HOCs/authGuard";
import { initStore } from "./redux/store";
import Unauthorized from "./components/Unauthorized";
import Student from "./components/studentAccess";
import About from "./components/About";

const store = initStore();

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App>
          <Switch>
            <Route path="/dashboard" component={authGuard(Dashboard)} exact />
            <Route path="/signup" component={SignUp} exact />
            <Route path="/login" component={Login} exact />
            <Route path="/unauthorized" component={Unauthorized} exact />
            <Route path="/student" component={authGuard(Student)} />
            <Route path="/about" component={About} exact />
            <Route path="/*" component={Home} />
          </Switch>
        </App>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
  document.getElementById("root")
);
