import React, { useEffect } from "react";
import { connect } from "react-redux";

export default function authGuard(OriginalComponent) {
  function MixedComponent(props) {
    useEffect(() => {
      if (!props.isAuthenticated && !props.jwtToken) {
        console.log("user is not authenticated");
        props.history.push("/unauthorized");
      }
    }, [props.isAuthenticated, props.jwtToken, props.history]);

    return <OriginalComponent />;
  }

  function mapStateToProps(state) {
    return {
      isAuthenticated: state.auth.isAuthenticated,
      jwtToken: state.auth.token,
    };
  }

  return connect(mapStateToProps)(MixedComponent);
}
