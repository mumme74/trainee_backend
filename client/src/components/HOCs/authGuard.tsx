import React, { useEffect } from "react";
import { connect } from "react-redux";
import { RootState } from "../../redux/store";
import { History } from "history";

type PropsType = {
  isAuthenticated: boolean;
  jwtToken: string;
  history: History;
};

type JsxProps = {
  logout: () => void;
};

export default function authGuard(
  OriginalComponent: React.ComponentType<any | string>
) {
  function MixedComponent(props: PropsType & JsxProps) {
    useEffect(() => {
      if (!props.isAuthenticated && !props.jwtToken) {
        console.log("user is not authenticated");
        props.history.push("/unauthorized");
      }
    }, [props.isAuthenticated, props.jwtToken, props.history]);

    return <OriginalComponent />;
  }

  function mapStateToProps(state: RootState) {
    return {
      isAuthenticated: state.auth.isAuthenticated,
      jwtToken: state.auth.token,
    };
  }

  return connect(mapStateToProps)(MixedComponent);
}
