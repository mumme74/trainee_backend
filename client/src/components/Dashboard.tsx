import React, { useEffect } from "react";
import { connect } from "react-redux";

import * as actions from "../redux/actions";
import { RootState } from "../redux/store";

type StatePropsT = {
  secret: string;
};
type StateActionsT = {
  getSecret: (path: string) => void;
};

function Dashboard(props: StatePropsT & StateActionsT) {
  useEffect(() => {
    (async function () {
      await props.getSecret("/users/secret");
    })();
  }, [props]);

  return (
    <div>
      <h1>Dashboard</h1>
      {props.secret && (
        <React.Fragment>
          <h3>Secrets...</h3>
          <p>{props.secret}</p>
        </React.Fragment>
      )}
    </div>
  );
}

function mapStateToProps(state: RootState): StatePropsT {
  return {
    secret: state.dash.secret,
  };
}

export default connect(mapStateToProps, actions)(Dashboard);
