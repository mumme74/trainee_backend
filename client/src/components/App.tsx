import React from "react";
import Header from "./header/Header";
import Sidemenu from "./menus/Sidemenu";

import "./App.css";

export default function App(props: { children: React.ReactNode }) {
  return (
    <React.Fragment>
      <Sidemenu />
      <div className="headerAndContent">
        <Header />
        <div className="container">{props.children}</div>
      </div>
    </React.Fragment>
  );
}
