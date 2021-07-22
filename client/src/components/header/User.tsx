import React, { useState } from "react";
import { Link } from "react-router-dom";
import { connect } from "react-redux";
import { compose } from "redux";
import { useTranslation } from "react-i18next";
import { Dropdown } from "react-bootstrap";
import i18next from "i18next";

import "flag-icon-css/css/flag-icon.min.css";

import * as actions from "../../redux/actions";
import { RootState } from "../../redux/store";
import Avatar from "./Avatar";
import DropdownMenu from "../menus/DropdownMenu";
import { myUserRoles } from "../../helpers";
import { availableLanguages } from "../../i18n/i18n";

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

  function changeLang(code: string | null) {
    i18next.changeLanguage(code || i18next.language);
  }

  const currentLang =
    availableLanguages.find(
      ({ code }) => code === i18next.language.substr(0, code.length)
    )?.country_code || "gb";

  const langChooser = (
    <li className="nav-item">
      <Dropdown onSelect={changeLang}>
        <Dropdown.Toggle id="dropdown-basic">
          <span className={`flag-icon flag-icon-${currentLang}`}></span>
        </Dropdown.Toggle>
        <Dropdown.Menu>
          {availableLanguages.map(({ code, name, country_code }) => {
            return (
              <Dropdown.Item key={code} eventKey={code}>
                <span
                  className={`flag-icon flag-icon-${country_code} mx-2`}
                ></span>
                {name}
              </Dropdown.Item>
            );
          })}
        </Dropdown.Menu>
      </Dropdown>
    </li>
  );

  return (
    <ul className="nav navbar-nav ml-auto mx-2">
      {!props.isAuthenticated ? (
        <React.Fragment>
          {langChooser}
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
            <div className="dropdown-divider"></div>
            <div
              className="text-center"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              {langChooser}
            </div>
          </DropdownMenu>
        </React.Fragment>
      )}
    </ul>
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
