import React from "react";

import classes from "./Avatar.module.css";

type JsxProps = {
  firstName: string;
  lastName: string;
  email: string;
  picture: string;
  onClick: () => void;
};

export default function Avatar(props: JsxProps) {
  const avatarTitle = `${props.firstName} ${props.lastName}\n ${props.email}`;
  const initials =
    (props.firstName ? props.firstName[0] : "?") +
    (props.lastName ? props.lastName[0] : "?");

  return (
    <li className="nav-item" onClick={props.onClick}>
      {props.picture ? (
        <img
          alt="Avatar"
          src={props.picture}
          className={classes.avatar}
          title={avatarTitle}
        />
      ) : (
        <div className={classes.avatar} title={avatarTitle}>
          {initials}
        </div>
      )}
    </li>
  );
}
