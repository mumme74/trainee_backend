import React from "react";
import { Link } from "react-router-dom";

export default function Unauthorized() {
  return (
    <div>
      <h1>You are not authorized to view the resource!</h1>
      <p>Please login first!</p>
      <Link to="/login">Login in here!</Link>
    </div>
  );
}
