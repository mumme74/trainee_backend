import React, { useState, useRef, useLayoutEffect } from "react";
import { connect } from "react-redux";

import css from "./ErrorNotifier.module.css";
import { RootState } from "../../redux/store";
import type { IError } from "../../redux/reducers/errors";
import DropdownMenu from "../menus/DropdownMenu";

type StatePropsT = {
  //unauthenticated: boolean;
  errors: [IError?];
};

type JsxPropsT = {};

interface IElement extends Element {
  readonly offsetLeft: number;
  readonly offsetTop: number;
}

const ErrorNotifier: React.FC<StatePropsT & JsxPropsT> = (props) => {
  const menuNodeRef = useRef<HTMLDivElement>(null);
  const errorCircle = useRef<HTMLDivElement>(null);

  const [showMenu, setShowMenu] = useState<boolean>(false);

  function stopClick(event: any) {
    let trgt = event.target as Element | null;
    while (trgt) {
      if (trgt === menuNodeRef.current || trgt === errorCircle.current) {
        event.stopPropagation();
        event.preventDefault();
        break;
      }

      trgt = trgt.parentNode as Element | null;
    }
  }

  return (
    <div onClick={stopClick}>
      {props.children}
      {props.errors.length > 0 && (
        <div
          className={css.errorCircle}
          ref={errorCircle}
          onClick={() => {
            setShowMenu(!showMenu);
          }}
          title={props.errors.length + " system errors"}
        />
      )}
      <DropdownMenu
        caption={"System errors"}
        ref={menuNodeRef}
        show={showMenu}
        onClose={() => {
          setShowMenu(false);
        }}
      >
        <React.Fragment>
          <ul>
            {props.errors.map((err) => {
              return (
                <li className="dropdown-item">{err?.message || err?.type}</li>
              );
            })}
          </ul>
          <footer>
            <span></span>
            <button className="btn-small">Clear</button>
          </footer>
        </React.Fragment>
      </DropdownMenu>
    </div>
  );
};

function mapStateToProps(state: RootState): StatePropsT {
  return {
    errors: state.error.errors,
  };
}

export default connect(mapStateToProps)(ErrorNotifier);
