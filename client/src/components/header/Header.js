import React from "react";
import { Link } from "react-router-dom";
import { connect } from "react-redux";
import { compose } from "redux";
import * as actions from "../../redux/actions";

import User from "./User";

function Header(props) {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary p-2">
      <Link className="navbar-brand ml-3" to="/">
        CodeWorkr API Auth
      </Link>
      <div className="collapse navbar-collapse justify-content-between">
        <ul className="navbar-nav mr-auto">
          <li className="nav-item">
            <Link className="nav-link" to="/dashboard">
              Dashboard
            </Link>
          </li>
        </ul>
        <ul className="nav navbar-nav ml-auto">
          <User />
        </ul>
      </div>
    </nav>
  );
}

const mapStateToProps = (state) => {
  return {
    isAuthenticated: state.auth.isAuthenticated,
  };
};

export default compose(connect(mapStateToProps, actions))(Header);
