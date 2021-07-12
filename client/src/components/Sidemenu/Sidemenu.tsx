import React from "react";
import Link from "react-router-dom";
import { connect } from "react-redux";

import { AppDispatch, RootState } from "../../redux/store";
import { setSidemenuIsShown } from "../../redux/actions";
import "./Sidemenu.css";

type StatePropsT = {
  isShown: boolean;
};
type JsxProps = {
  className?: string;
  caption?: string;
};
type ActionPropsT = {
  setSidemenuIsShown: (e: any) => void;
};

const Sidemenu: React.FC<
  React.PropsWithChildren<StatePropsT & ActionPropsT & JsxProps>
> = (props) => {
  function close() {
    props.setSidemenuIsShown(false);
  }

  return (
    <nav
      className={
        props.className +
        " sidemenuWrapper" +
        (props.isShown ? " show" : "") +
        " menu"
      }
    >
      <div className="sidemenuHeader">
        <span>{props.caption ? props.caption : "Menu"}</span>
        <button className="btn-close btn shadow-none" onClick={close}></button>
      </div>
      <div className="menu-divider"></div>
      <div className="menu-item">item1</div>
      <div className="sidemenuContent">{props.children}</div>
    </nav>
  );
};

// redux stuff
const mapStateToProps = (state: RootState): StatePropsT => {
  return {
    isShown: state.sidemenu.isShown,
  };
};

const mapDispatchToProps = (dispatch: AppDispatch): ActionPropsT => {
  return {
    setSidemenuIsShown: (e: any) => {
      setSidemenuIsShown(false)(dispatch);
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Sidemenu);
