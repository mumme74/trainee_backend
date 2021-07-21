import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { withAuthGuardStudent } from "../HOCs/authGuards";

type StatePropsT = {};

type JsxPropsT = {
  closeHandler: () => void;
};

const StudentMenu: React.FC<StatePropsT & JsxPropsT> = (props) => {
  const { t } = useTranslation("core");
  return (
    <div className="container" onClick={props.closeHandler}>
      <h4>{t("student_menu_header")}:</h4>
      <ul className="list-group">
        <li className="list-group-item">
          <Link to="/student/dashboard">{t("dashboard")}</Link>
        </li>
      </ul>

      <h4>{t("student_menu_personal_header")}:</h4>
      <ul className="list-group">
        <li className="list-group-item">
          <Link to="/student/profile">{t("profile")}</Link>
        </li>
      </ul>
    </div>
  );
};

export default withAuthGuardStudent(StudentMenu);
