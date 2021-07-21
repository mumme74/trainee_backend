import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { connect } from "react-redux";
import { useTranslation } from "react-i18next";

import * as actions from "../redux/actions";
import { AppDispatch, RootState } from "../redux/store";
import { withAuthGuardCommon } from "./HOCs/authGuards";

type StatePropsT = {
  secret: string;
  isAuthenticated: boolean;
};
type ActionPropsT = {
  getSecret: (path: string) => Promise<void>;
};

const Dashboard: React.FC<StatePropsT & ActionPropsT> = (props) => {
  const { t } = useTranslation("core");

  useEffect(() => {
    (async function (isAuth: boolean) {
      await props.getSecret("/users/secret");
    })(props.isAuthenticated);
  }, [props.getSecret, props.isAuthenticated]);

  return (
    <div>
      <h1>{t("dashroot_header")}</h1>
      {props.secret && (
        <React.Fragment>
          <h3>{t("dashroot_secrets")}...</h3>
          <p>{props.secret}</p>
        </React.Fragment>
      )}
      <Link to="/profile">{t("dashroot_profile_page")}</Link>
    </div>
  );
};

function mapStateToProps(state: RootState): StatePropsT {
  return {
    secret: state.dash.secret,
    isAuthenticated: state.auth.isAuthenticated,
  };
}

export default connect(
  mapStateToProps,
  actions
)(withAuthGuardCommon(Dashboard));
