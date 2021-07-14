import React from "react";
import { Link } from "react-router-dom";

import { withAuthGuardStudent } from "../HOCs/authGuards";

type StatePropsT = {};

type JsxPropsT = {
  closeHandler: () => void;
};

const StudentMenu: React.FC<StatePropsT & JsxPropsT> = (props) => {
  return (
    <div className="container" onClick={props.closeHandler}>
      <h4>Student menu:</h4>
      <ul className="list-group">
        <li className="list-group-item">
          <Link to="/student/dashboard">Dashboard</Link>
        </li>
      </ul>

      <h4>Personal stuff:</h4>
      <ul className="list-group">
        <li className="list-group-item">
          <Link to="/student/profile">Profile</Link>
        </li>
      </ul>
    </div>
  );
};

export default withAuthGuardStudent(StudentMenu);
