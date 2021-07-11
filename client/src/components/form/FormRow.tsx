import React from "react";
import { FieldRenderProps } from "react-final-form";

/*
type StatePropsT = {
  caption: string;
  input: [any];
  placeholder?: string;
  autocomplete: string;
  meta: { active: boolean; error: string; touched: boolean };
};
*/
type Props = FieldRenderProps<string, any>;

const FormRow: React.FC<Props> = (props: Props) => {
  return (
    <div className={"row p-1" + (props.meta.active ? " bg-info" : "")}>
      <label className="col-sm-2">{props.caption}</label>
      <input
        {...props.input}
        className="col-sm form-control"
        placeholder={props.placeholder || props.caption}
        autoComplete={props.autocomplete || "on"}
        readOnly={props.readonly}
      />
      {props.meta.error && props.meta.touched && (
        <div className="row">
          <div className="col-sm-2" />
          <span className="col-sm text-danger">{props.meta.error}</span>
        </div>
      )}
    </div>
  );
};
export default FormRow;
