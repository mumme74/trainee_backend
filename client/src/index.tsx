// non project imports
import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter, Switch, Route } from "react-router-dom";
import { Provider } from "react-redux";

// non components
import { initAxios } from "./axiosCommon";
import { initStore } from "./redux/store";
import "./i18n/i18n";

// components
import App from "./components/App";
import Home from "./components/Home";
import Dashboard from "./components/Dashboard";
import SignUp from "./components/login/SignUp";
import Login from "./components/login/Login";
import Unauthorized from "./components/Unauthorized";
import Student from "./components/studentAccess";
import Admin from "./components/adminAccess";
import Teacher from "./components/teacherAccess";
import SuperAdmin from "./components/superAdminAccess";
import About from "./components/About";
import DeleteMe from "./components/login/DeleteMe";

const store = initStore();
initAxios();

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <React.Suspense fallback="Ĺoading...">
          <App>
            <Switch>
              <Route path="/dashboard" component={Dashboard} exact />
              <Route path="/signup" component={SignUp} exact />
              <Route path="/login" component={Login} exact />
              <Route path="/unauthorized" component={Unauthorized} exact />
              <Route path="/student" component={Student} />
              <Route path="/teacher" component={Teacher} />
              <Route path="/admin" component={Admin} />
              <Route path="/superadmin" component={SuperAdmin} />
              <Route path="/deleteme" component={DeleteMe} />
              <Route path="/about" component={About} exact />
              <Route path="/*" component={Home} />
            </Switch>
          </App>
        </React.Suspense>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
  document.getElementById("root"),
);
