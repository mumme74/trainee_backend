import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { connect } from "react-redux";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";
import { useTranslation } from "react-i18next";

import { AppDispatch, RootState } from "../../redux/store";
import { setSidemenuIsShown } from "../../redux/actions";
import { myUserRoles } from "../../helpers";
import StudentMenu from "../studentAccess/StudentMenu";
import TeacherMenu from "../teacherAccess/TeacherMenu";
import AdminMenu from "../adminAccess/AdminMenu";
import SuperAdminMenu from "../superAdminAccess/SuperAdminMenu";

import "./Sidemenu.css";

type StatePropsT = {
  isShown: boolean;
};
type JsxProps = {
  className?: string;
  caption?: string;
};
type ActionPropsT = {
  setSidemenuIsShown: (e: any) => void;
};

const Sidemenu: React.FC<
  React.PropsWithChildren<StatePropsT & ActionPropsT & JsxProps>
> = (props) => {
  const myRoles = myUserRoles();
  const [curRole, setCurRole] = useState(myRoles[0] || "");

  const { t } = useTranslation("core");

  useEffect(() => {
    if (!myRoles.length) {
      // just logged out
      setCurRole("");
    } else if (curRole === "" && myRoles.length) {
      // just logged in
      setCurRole(myRoles[0]);
    }
  });

  function close() {
    props.setSidemenuIsShown(false);
  }

  function changeRole(role: any) {
    setCurRole(role);
    console.log("changed role", role);
  }

  function getSelectedMenu() {
    switch (curRole) {
      case "student":
        return <StudentMenu closeHandler={close} />;
      case "teacher":
        return <TeacherMenu closeHandler={close} />;
      case "admin":
        return <AdminMenu closeHandler={close} />;
      case "super":
        return <SuperAdminMenu closeHandler={close} />;
      default:
        return (
          <div className="container p-2">
            <h4>{t("menu")}</h4>
            <ul className="list-group">
              <li className="list-group-item">
                <Link to="/">{t("start")}</Link>
              </li>
              <li className="list-group-item">
                <Link to="/about">{t("about")}</Link>
              </li>
            </ul>
          </div>
        );
    }
  }

  return (
    <nav
      className={
        props.className +
        " sidemenuWrapper" +
        (props.isShown ? " show" : "") +
        " menu"
      }
    >
      <div className="sidemenuHeader">
        <span>{props.caption ? props.caption : t("menu")}</span>
        <button
          className="btn-close btn-small shadow-none"
          onClick={close}
        ></button>
      </div>
      {props.children !== undefined ? (
        <div className="sidemenuContent">{props.children}</div>
      ) : (
        <React.Fragment>
          {myRoles.length > 1 && (
            <React.Fragment>
              <DropdownButton
                className="m-2"
                onSelect={changeRole}
                title={t("role") + ": " + curRole}
              >
                {myRoles.map((role) => (
                  <Dropdown.Item eventKey={role} key={role}>
                    {role}
                  </Dropdown.Item>
                ))}
              </DropdownButton>
              <div className="menu-divider"></div>
            </React.Fragment>
          )}
          {getSelectedMenu()}
        </React.Fragment>
      )}
    </nav>
  );
};

// redux stuff
const mapStateToProps = (state: RootState): StatePropsT => {
  return {
    isShown: state.sidemenu.isShown,
  };
};

const mapDispatchToProps = (dispatch: AppDispatch): ActionPropsT => {
  return {
    setSidemenuIsShown: (e: any) => {
      setSidemenuIsShown(false)(dispatch);
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Sidemenu);
