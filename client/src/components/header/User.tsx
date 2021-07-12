import React from "react";
import { Link } from "react-router-dom";
import { connect } from "react-redux";
import { compose } from "redux";
import * as actions from "../../redux/actions";
import { RootState } from "../../redux/store";

import Avatar from "./Avatar";

type StateProps = {
  isAuthenticated: boolean;
  firstName: string;
  lastName: string;
  picture: string;
  email: string;
};

type JsxProps = {
  logout: () => void;
};

function User(props: StateProps & JsxProps) {
  return (
    <React.Fragment>
      {!props.isAuthenticated ? (
        <React.Fragment>
          <li className="nav-item">
            <Link className="nav-link" to="signup">
              Sign Up
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link" to="/login">
              Login
            </Link>
          </li>
        </React.Fragment>
      ) : (
        <Avatar
          firstName={props.firstName}
          lastName={props.lastName}
          email={props.email}
          picture={props.picture}
        >
          <Link className="dropdown-item" to="/student/dashboard">
            Dashboard
          </Link>
          <Link className="dropdown-item" to="/student/profile">
            Edit my profile
          </Link>
          <div className="dropdown-divider"></div>
          <button className="dropdown-item btn" onClick={props.logout}>
            Log out
          </button>
          <div className="dropdown-divider"></div>
          <Link className="dropdown-item" to="/about">
            About
          </Link>
        </Avatar>
      )}
    </React.Fragment>
  );
}

const mapStateToProps = (state: RootState): StateProps => {
  return {
    isAuthenticated: state.auth.isAuthenticated,
    firstName: state.user.firstName,
    lastName: state.user.lastName,
    picture: state.user.picture,
    email: state.user.email,
  };
};

export default compose(connect(mapStateToProps, actions))(User);
