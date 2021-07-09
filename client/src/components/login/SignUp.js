import React, { useEffect } from "react";
import { Form, Field } from "react-final-form";
import { connect } from "react-redux";
import { compose } from "redux";

import FormRow from "../form/FormRow";
import val from "../form/validators";
import * as actions from "../../redux/actions";
import OAuthLogin from "./OAuthLogin";


function SignUp(props) {

  const onSubmit = async (formData) => {
    try {
      console.log("submit");
      // we need to call a actionCreator
      await props.signUp(formData);
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
            </div>
            <Field
              name="userName"
              type="text"
              caption="Username"
              validate={val.userName}
              component={FormRow}
            />
            <Field
              name="firstName"
              type="text"
              caption="First name"
              validate={val.required}
              component={FormRow}
            />
            <Field
              name="lastName"
              type="text"
              caption="Last name"
              validate={val.required}
              component={FormRow}
            />
            <Field
              name="email"
              type="email"
              caption="Email"
              validate={val.emailValidator}
              component={FormRow}
            />
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

const mapStateToProps = (state) => {
  return {
    error: state.auth.error,
    isAuthenticated: state.auth.isAuthenticated,
  };
};

export default compose(connect(mapStateToProps, actions))(SignUp);
