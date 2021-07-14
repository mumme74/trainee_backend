import React from "react";
import { Link } from "react-router-dom";

import OAuthLogin from "./login/OAuthLogin";
import { store } from "../redux/store";

type JsxPropsT = {
  requiredRoles?: [string];
};

const Unauthorized: React.FC<JsxPropsT> = (props) => {
  const oauthLogin = !!store.getState().user.googleId;

  return (
    <div className="container">
      <h1>You are not authorized to view the resource!</h1>
      <p>Please login first!</p>
      {oauthLogin ? <OAuthLogin /> : <Link to="/login">Login in here!</Link>}

      {props.requiredRoles && (
        <div className="badge bg-warning mx-2">
          You need: {props.requiredRoles.join(", ")} role access
        </div>
      )}
    </div>
  );
};

export default Unauthorized;
