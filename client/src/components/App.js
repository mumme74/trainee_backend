import React from "react";
import Header from "./header/Header";

export default function App(props) {
  return (
    <React.Fragment>
      <Header />
      <div className="container">{props.children}</div>
    </React.Fragment>
  );
}
