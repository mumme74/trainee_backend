import React from "react";
import { Link } from "react-router-dom";

import { withAuthGuardStudent, withAuthGuardTeacher } from "../HOCs/authGuards";

type StatePropsT = {};

type JsxPropsT = {
  closeHandler: () => void;
};

const TeacherMenu: React.FC<StatePropsT & JsxPropsT> = (props) => {
  return (
    <div className="container" onClick={props.closeHandler}>
      <h4>Teacher menu:</h4>
      <ul className="list-group">
        <li className="list-group-item">
          <Link to="/student/dashboard">Something?</Link>
        </li>
      </ul>
    </div>
  );
};

export default withAuthGuardTeacher(TeacherMenu);
