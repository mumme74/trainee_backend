import React from "react";
import { Link } from "react-router-dom";

import OAuthLogin from "./login/OAuthLogin";
import { store } from "../redux/store";

export default function Unauthorized() {
  const oauthLogin = !!store.getState().user.googleId;

  return (
    <div>
      <h1>You are not authorized to view the resource!</h1>
      <p>Please login first!</p>
      {oauthLogin ? <OAuthLogin /> : <Link to="/login">Login in here!</Link>}
    </div>
  );
}
