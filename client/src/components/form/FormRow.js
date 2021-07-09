import React from "react";


export default function FormRow(props) {
  return (
    <div className={"row p-1" + (props.meta.active ? " bg-info" : "")}>
      <label className="col-sm-2">{props.caption}</label>
      <input
        {...props.input}
        className="col-sm form-control"
        placeholder={props.placeholder || props.caption}
        autoComplete={props.autocomplete || 'on'}
      />
      {props.meta.error && props.meta.touched && (
        <div className="row">
          <div className="col-sm-2" />
          <span className="col-sm text-danger">{props.meta.error}</span>
        </div>
      )}
    </div>
  );
}
