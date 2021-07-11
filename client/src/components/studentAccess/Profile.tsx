import React, { useState } from "react";
import { connect } from "react-redux";
import { compose } from "redux";
import { Form, Field } from "react-final-form";

import { RootState } from "../../redux/store";
import { IUser } from "../../redux/actions/types";
import * as actions from "../../redux/actions";
import val from "../form/validators";
import FormRow from "../form/FormRow";

// render a profile form where users can change their own inforamtion

type ActionPropsT = {
  saveMyUserInfo: (data: IUser) => void;
  changeMyPassword: (data: { password: string }) => void;
};
type StatePropsT = {
  user: IUser;
};

const Profile: React.FC<StatePropsT & ActionPropsT> = (props) => {
  const [showPw, setShowPw] = useState(false);

  // if it is a google user he/she can't edit, as it is handled by google
  const locked = !!props.user.googleId;

  function saveUserInfo(data: IUser) {
    console.log("onSubmit called", data);
    props.saveMyUserInfo(data);
  }

  function changePassword(data: { password: string }) {
    console.log("Changing password");
    props.changeMyPassword({ password: data.password });
  }

  return (
    <div>
      {locked && (
        <div className="alert alert-warning" role="alert">
          Your profile is managed at Google!
        </div>
      )}
      <Form onSubmit={saveUserInfo} initialValues={props.user}>
        {({ handleSubmit, pristine, form, submitting }) => (
          <form onSubmit={handleSubmit} className="container p-2">
            <div className="row">
              <div className="col-sm-2"></div>
              <h3 className="col-sm">Your profile information</h3>
            </div>
            <Field
              name="userName"
              type="text"
              caption="Username"
              readonly={true}
              component={FormRow}
            />
            <Field
              name="firstName"
              type="text"
              readonly={locked}
              caption="First name"
              validate={val.required}
              component={FormRow}
            />
            <Field
              name="lastName"
              type="text"
              caption="Last name"
              readonly={locked}
              validate={val.required}
              component={FormRow}
            />
            <Field
              name="email"
              type="email"
              caption="Email"
              readonly={locked}
              validate={val.emailValidator}
              component={FormRow}
            />
            <Field
              name="picture"
              type="text"
              caption="Picture"
              readonly={locked}
              component={FormRow}
            />
            <div className="row">
              <div className="col-sm-2" />
              <div className="col-sm p-2">
                <button
                  type="submit"
                  disabled={submitting || locked}
                  className="btn btn-primary"
                >
                  Save
                </button>
                {props.user.error.message && (
                  <div className="badge bg-danger m-2">
                    {props.user.error.message}
                  </div>
                )}
              </div>
            </div>
          </form>
        )}
      </Form>
      <button
        disabled={locked}
        className={"btn " + (showPw ? "btn-secondary" : "btn-info")}
        onClick={() => {
          setShowPw(!showPw);
        }}
      >
        {showPw ? "Hide Passwords" : "Show Passwords"}
      </button>
      {showPw && (
        <Form
          onSubmit={changePassword}
          validate={(values: { confirm: string; password: string }) => {
            return values.confirm !== values.password
              ? { confirm: "Must match with password" }
              : {};
          }}
        >
          {({ handleSubmit, pristine, form, submitting }) => (
            <form onSubmit={handleSubmit} className="container p-2">
              <div className="row">
                <div className="col-sm-2"></div>
                <h3 className="col-sm">Change Password</h3>
              </div>
              <Field
                name="password"
                type="password"
                caption="Password"
                validate={val.passwordValidator}
                component={FormRow}
              />
              <Field
                name="confirm"
                type="password"
                caption="Confirm"
                placeholder="Confirm password"
                component={FormRow}
              />
              <div className="row">
                <div className="col-sm-2" />
                <div className="col-sm p-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-primary"
                  >
                    Change Password
                  </button>
                  {props.user.error.message && (
                    <div className="badge bg-danger m-2">
                      {props.user.error.message}
                    </div>
                  )}
                </div>
              </div>
            </form>
          )}
        </Form>
      )}
    </div>
  );
};

const mapStateToProps = (state: RootState) => {
  return {
    user: { ...state.user },
  };
};

export default compose(connect(mapStateToProps, actions))(Profile);
