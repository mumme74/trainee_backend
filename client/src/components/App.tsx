import React from "react";
import Header from "./header/Header";

export default function App(props: { children: React.ReactNode }) {
  return (
    <React.Fragment>
      <Header />
      <div className="container">{props.children}</div>
    </React.Fragment>
  );
}
