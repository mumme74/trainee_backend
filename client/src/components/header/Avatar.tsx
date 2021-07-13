import React, { useState, useLayoutEffect, useRef } from "react";

import classes from "./Avatar.module.css";

type JsxProps = {
  firstName: string;
  lastName: string;
  email: string;
  picture: string;
  onClick?: () => void;
};

const Avatar: React.FC<JsxProps> = (props) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuNode = useRef<HTMLDivElement>(null);
  const avatarImgNode = useRef<HTMLImageElement>(null);
  const avatarDivNode = useRef<HTMLDivElement>(null);

  function onClickHandler() {
    setShowMenu(!showMenu);
    if (props.onClick) props.onClick();
  }

  useLayoutEffect(() => {
    const avatarNode = avatarImgNode.current || avatarDivNode.current;

    if (showMenu && menuNode.current && avatarNode) {
      const menuStyle = window.getComputedStyle(menuNode.current as Element);
      const imageStyle = window.getComputedStyle(avatarNode as Element);

      const moveX =
        0 -
        +menuStyle.width.replace("px", "") +
        +imageStyle.width.replace("px", "");
      menuNode.current.style.transform = `translate(${moveX}px)`;
    }
  }, [showMenu]);

  const avatarTitle = `${props.firstName} ${props.lastName}\n ${props.email}`;
  const initials =
    (props.firstName ? props.firstName[0] : "?") +
    (props.lastName ? props.lastName[0] : "?");

  return (
    <React.Fragment>
      <li className="nav-item dropdown" onClick={onClickHandler}>
        {props.picture ? (
          <img
            alt="Avatar"
            src={props.picture}
            className={classes.avatar}
            title={avatarTitle}
            ref={avatarImgNode}
          />
        ) : (
          <div
            className={classes.avatar}
            title={avatarTitle}
            ref={avatarDivNode}
          >
            {initials}
          </div>
        )}
        {props.children && (
          <div
            ref={menuNode}
            className={
              "dropdown-menu dropdown-menu-right" +
              (showMenu ? " show" : "hide")
            }
          >
            {props.children}
          </div>
        )}
      </li>
    </React.Fragment>
  );
};

export default Avatar;
