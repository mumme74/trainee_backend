import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { connect } from "react-redux";

import * as actions from "../redux/actions";
import { RootState } from "../redux/store";

type StatePropsT = {
  secret: string;
  isAuthenticated: boolean;
};
type StateActionsT = {
  getSecret: (path: string) => void;
};

function Dashboard(props: StatePropsT & StateActionsT) {
  useEffect(() => {
    (async function (isAuth: boolean) {
      await props.getSecret("/users/secret");
    })(props.isAuthenticated);
  }, [props.getSecret, props.isAuthenticated]);

  return (
    <div>
      <h1>Dashboard</h1>
      {props.secret && (
        <React.Fragment>
          <h3>Secrets...</h3>
          <p>{props.secret}</p>
        </React.Fragment>
      )}
      <Link to="/profile">Your profile page</Link>
    </div>
  );
}

function mapStateToProps(state: RootState): StatePropsT {
  return {
    secret: state.dash.secret,
    isAuthenticated: state.auth.isAuthenticated,
  };
}

export default connect(mapStateToProps, actions)(Dashboard);
