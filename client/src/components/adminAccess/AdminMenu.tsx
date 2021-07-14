import React from "react";
import { Link } from "react-router-dom";

import { withAuthGuardAdmin, withAuthGuardStudent } from "../HOCs/authGuards";

type StatePropsT = {};

type JsxPropsT = {
  closeHandler: () => void;
};

const AdminMenu: React.FC<StatePropsT & JsxPropsT> = (props) => {
  return (
    <div className="container" onClick={props.closeHandler}>
      <h4>Admin menu:</h4>
      <ul className="list-group">
        <li className="list-group-item">
          <Link to="/student/dashboard">Something?</Link>
        </li>
      </ul>
    </div>
  );
};

export default withAuthGuardAdmin(AdminMenu);
