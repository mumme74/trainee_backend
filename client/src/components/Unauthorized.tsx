import React from "react";
import { Link } from "react-router-dom";

import OAuthLogin from "./login/OAuthLogin";
import { store } from "../redux/store";
import { useTranslation } from "react-i18next";

type JsxPropsT = {
  requiredRoles?: [string];
};

const Unauthorized: React.FC<JsxPropsT> = (props) => {
  const oauthLogin = !!store.getState().user.googleId;
  const { t } = useTranslation("core");

  return (
    <div className="container">
      <h1>{t("unauth_header")}</h1>
      <p>{t("unauth_login_first")}</p>
      {oauthLogin ? <OAuthLogin /> : <Link to="/login">{t("login_here")}</Link>}

      {props.requiredRoles && (
        <div className="badge bg-warning mx-2">
          {t("unauth_req_role_pre") +
            " " +
            props.requiredRoles.join(", ") +
            " " +
            t("unauth_req_role_post")}
        </div>
      )}
    </div>
  );
};

export default Unauthorized;
