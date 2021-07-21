import React, { useState } from "react";
import { Link } from "react-router-dom";
import { connect } from "react-redux";
import { compose } from "redux";
import { useTranslation } from "react-i18next";

import * as actions from "../../redux/actions";
import { RootState } from "../../redux/store";
import Avatar from "./Avatar";
import DropdownMenu from "../menus/DropdownMenu";
import { myUserRoles } from "../../helpers";

type StateProps = {
  isAuthenticated: boolean;
  firstName: string;
  lastName: string;
  picture: string;
  email: string;
};

type JsxProps = {
  logout: () => void;
};

function User(props: StateProps & JsxProps) {
  const [showMenu, setShowMenu] = useState<boolean>(false);

  const { t } = useTranslation("core");

  function toogleMenu() {
    setShowMenu(!showMenu);
  }

  return (
    <div className="">
      {!props.isAuthenticated ? (
        <React.Fragment>
          <li className="nav-item">
            <Link className="nav-link" to="/login">
              {t("login")}
            </Link>
          </li>
        </React.Fragment>
      ) : (
        <React.Fragment>
          <Avatar
            firstName={props.firstName}
            lastName={props.lastName}
            email={props.email}
            picture={props.picture}
            onClick={toogleMenu}
          ></Avatar>
          <DropdownMenu
            show={showMenu}
            onClose={() => {
              setShowMenu(false);
            }}
            caption={myUserRoles().join(", ")}
            closeOnClick={true}
          >
            <Link className="dropdown-item" to="/student/dashboard">
              {t("dashboard")}
            </Link>
            <Link className="dropdown-item" to="/student/profile">
              {t("header_edit_my_profile")}
            </Link>
            <div className="dropdown-divider"></div>
            <button className="dropdown-item btn" onClick={props.logout}>
              {t("logout")}
            </button>
            <div className="dropdown-divider"></div>
            <Link className="dropdown-item" to="/about">
              {t("about")}
            </Link>
          </DropdownMenu>
        </React.Fragment>
      )}
    </div>
  );
}

const mapStateToProps = (state: RootState): StateProps => {
  return {
    isAuthenticated: state.auth.isAuthenticated,
    firstName: state.user.firstName,
    lastName: state.user.lastName,
    picture: state.user.picture,
    email: state.user.email,
  };
};

export default compose(connect(mapStateToProps, actions))(User);
