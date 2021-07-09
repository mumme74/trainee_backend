import React from "react";
import { Link } from "react-router-dom";
import { connect } from "react-redux";
import { compose } from "redux";
import * as actions from "../../redux/actions";

import Avatar from "./Avatar";

function User(props) {
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
          userName={props.userName}
          firstName={props.firstName}
          lastName={props.lastName}
          email={props.email}
          picture={props.picture}
          onClick={props.logout}
        />
      )}
    </React.Fragment>
  );
}

const mapStateToProps = (state) => {
  return {
    isAuthenticated: state.auth.isAuthenticated,
    userName: state.user.userName,
    firstName: state.user.firstName,
    lastName: state.user.lastName,
    picture: state.user.picture,
    email: state.user.email,
  };
};

export default compose(connect(mapStateToProps, actions))(User);
