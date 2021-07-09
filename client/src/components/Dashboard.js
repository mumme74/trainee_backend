import React, { useEffect } from "react";
import { connect } from "react-redux";

import * as actions from "../redux/actions";

function Dashboard(props) {
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

function mapStateToProps(state) {
    console.log(state)
  return {
    secret: state.dash.secret,
  };
}

export default connect(mapStateToProps, actions)(Dashboard);
