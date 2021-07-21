import React from "react";
import { Link } from "react-router-dom";
import { connect } from "react-redux";
import { useTranslation } from "react-i18next";

import Logo from "./Logo";
import User from "./User";
import { AppDispatch, RootState } from "../../redux/store";
import { toggleSidemenu } from "../../redux/actions";
import ProgressIndicator from "./ProgressIndicator";
import ErrorNotifier from "./ErrorNotifier";

type StatePropsT = {
  isShown: boolean;
  activeReqCnt: number;
};

function mapStateToProps(state: RootState): StatePropsT {
  return {
    isShown: state.sidemenu.isShown,
    activeReqCnt: state.communication.activeReqCnt,
  };
}

type ActionPropsT = {
  toogleSidemenu: (e: any) => void;
};

function mapDispatchToProps(dispatch: AppDispatch): ActionPropsT {
  return {
    toogleSidemenu: (e) => toggleSidemenu()(dispatch),
  };
}

const Header: React.FC<StatePropsT & ActionPropsT> = (props) => {
  const { t } = useTranslation("core");

  return (
    <nav className="navbar navbar-expand-sm navbar-dark bg-primary pt-0 pb-0 pr-2">
      <ul className="navbar-nav ml-0 h3">
        <span
          className="nav-link"
          style={{ cursor: "pointer" }}
          onClick={props.toogleSidemenu}
        >
          &#8801;
        </span>
      </ul>
      <Link className="navbar-brand ml-3" to="/">
        <ErrorNotifier>
          <ProgressIndicator progress={props.activeReqCnt > 0 ? 0.5 : 0.0}>
            <Logo />
          </ProgressIndicator>
        </ErrorNotifier>
      </Link>
      <div className="collapse navbar-collapse justify-content-between">
        <ul className="navbar-nav mr-auto">
          <li className="nav-item">
            <Link className="nav-link" to="/dashboard">
              {t("dashboard")}
            </Link>
          </li>
        </ul>
        <ul className="nav navbar-nav ml-auto mx-2">
          <User />
        </ul>
      </div>
    </nav>
  );
};

export default connect(mapStateToProps, mapDispatchToProps)(Header);
