import React from "react";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";
import { useTranslation } from "react-i18next";

export default function StudentDashboard() {
  const { t } = useTranslation("core");
  return (
    <div className="container">
      <h1>{t("student_dashboard")}</h1>
      <div className="row">
        <div className="col-sm-4">
          <h3>Todo!</h3>
          <ul>
            <li>Todo 1</li>
            <li>Todo2</li>
          </ul>
        </div>
        <div className="col-sm-4">
          <h3>Done!</h3>
          <ul>
            <li>Done1</li>
            <li>Done2</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
