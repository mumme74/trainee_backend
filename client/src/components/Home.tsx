import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div>
      <h1>Welcome to our webbapp!</h1>
      <p>This is a app to make teachers work more manageble.</p>
      <p>If you want to use it, plese login first!</p>
      <Link to="/login">Log in here!</Link>
    </div>
  );
}
