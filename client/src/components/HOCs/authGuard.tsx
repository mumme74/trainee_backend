import React, { useEffect } from "react";
import { connect } from "react-redux";
import { History } from "history";

import Unauthorized from "../Unauthorized";
import { RootState } from "../../redux/store";
import { isAuthenticated } from "../../helpers";

type StatePropsT = {
  isAuthenticated: boolean;
};

type JsxPropsT = {
  logout: () => void;
  history: History;
};

export default function authGuard(
  OriginalComponent: React.ComponentType<any | string>
) {
  const MixedComponent: React.FC<StatePropsT & JsxPropsT> = (props) => {
    if (!isAuthenticated() || !isAuthenticated) {
      console.log("user is not authenticated");
      return <Unauthorized />;
    } else {
      return <OriginalComponent />;
    }
  };

  function mapStateToProps(state: RootState): StatePropsT {
    return {
      isAuthenticated: state.auth.isAuthenticated,
    };
  }

  return connect(mapStateToProps)(MixedComponent);
}
