import React, { useState, useEffect } from "react";
import { Form, Field } from "react-final-form";
import { connect } from "react-redux";
import { compose } from "redux";
import { History } from "history";

import FormRow from "../form/FormRow";
import val from "../form/validators";
import * as actions from "../../redux/actions";
import OAuthLogin from "./OAuthLogin";
import { RootState } from "../../redux/store";
import { IAuth, ISignUpNewUserForm } from "../../redux/actions/types";

type StatePropsT = {
  isAuthenticated: boolean;
  error: IAuth["error"];
};

type ActionPropsT = {
  signUp: (data: ISignUpNewUserForm) => void;
  history: History;
};

interface IFormData extends ISignUpNewUserForm {
  confirm: string;
}

function SignUp(props: StatePropsT & ActionPropsT) {
  const [locked, setLocked] = useState<boolean>(true);

  const onSubmit = async (formData: IFormData) => {
    try {
      console.log("submit");
      // we need to call a actionCreator
      const data = { ...formData, confirm: undefined };
      props.signUp(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (props.isAuthenticated) {
      props.history.push("/dashboard");
    }
  }, [props.isAuthenticated, props.history]);

  return (
    <React.Fragment>
      <OAuthLogin />

      <Form
        onSubmit={onSubmit}
        validate={(values) => {
          return values.confirm !== values.password
            ? { confirm: "Must match with password" }
            : {};
        }}
      >
        {({ handleSubmit, pristine, form, submitting }) => (
          <form onSubmit={handleSubmit} className="container p-2">
            <div className="row">
              <div className="col-sm-2"></div>
              <h3 className="col-sm">Sign up as new user</h3>
              <p>
                If you join through login information below you can't access
                content from people in your domain.
              </p>
              <p>
                Most likely you want to join through Google OAuth account on the
                above button instead.
              </p>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setLocked(false);
                }}
              >
                Unlock fields
              </button>
            </div>
            <Field
              name="userName"
              type="text"
              caption="Username"
              validate={val.userName}
              disabled={locked}
              component={FormRow}
            />
            <Field
              name="firstName"
              type="text"
              caption="First name"
              validate={val.required}
              disabled={locked}
              component={FormRow}
            />
            <Field
              name="lastName"
              type="text"
              caption="Last name"
              validate={val.required}
              disabled={locked}
              component={FormRow}
            />
            <Field
              name="email"
              type="email"
              caption="Email"
              validate={val.emailValidator}
              disabled={locked}
              component={FormRow}
            />
            <Field
              name="password"
              type="password"
              caption="Password"
              validate={val.passwordValidator}
              disabled={locked}
              component={FormRow}
            />
            <Field
              name="confirm"
              type="password"
              caption="Confirm"
              placeholder="Confirm password"
              disabled={locked}
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
                  Sign Up
                </button>
                {props.error.message && (
                  <div className="badge bg-danger m-2">
                    {props.error.message}
                  </div>
                )}
              </div>
            </div>
          </form>
        )}
      </Form>
    </React.Fragment>
  );
}

const mapStateToProps = (state: RootState) => {
  return {
    error: state.auth.error,
    isAuthenticated: state.auth.isAuthenticated,
  };
};

export default compose(connect(mapStateToProps, actions))(SignUp);
