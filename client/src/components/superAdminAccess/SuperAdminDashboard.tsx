import React from "react";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";

export default function SuperAdminDashboard() {
  return (
    <div className="container">
      <h1>Superadmin Dashboard</h1>
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
