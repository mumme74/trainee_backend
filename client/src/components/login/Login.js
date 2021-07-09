import React, { useEffect } from "react";
import { Form, Field } from "react-final-form";
import { connect } from "react-redux";
import { compose } from "redux";

import FormRow from "../form/FormRow";
import val from "../form/validators";
import * as actions from "../../redux/actions";
import OAuthLogin from "./OAuthLogin";
import { SERVERURL } from "../../config/config";

function Login(props) {
  const onSubmit = async (formData) => {
    try {
      console.log("submit");
      // we need to call a actionCreator
      await props.login(formData);
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
      <a href={`${SERVERURL}/users/oauth/google?state=12345`}>Sign In with Google</a>
      <OAuthLogin />
      <Form
        onSubmit={onSubmit}
        validate={(values) => {
          let errObj = {};
          if (values.login?.length < 3) {
            if (values.login.indexOf("@") > -1) {
              errObj.login = val.userName(values.login);
            } else {
              errObj.login = val.emailValidator(values.email);
            }
          }
          return errObj;
        }}
      >
        {({ handleSubmit, pristine, form, submitting }) => (
          <form onSubmit={handleSubmit} className="container p-2">
            <div className="row">
              <div className="col-sm-2"></div>
              <h3 className="col-sm">Sign in</h3>
            </div>
            <Field
              name="login"
              type="text"
              caption="Login"
              component={FormRow}
            />
            <Field
              name="password"
              type="password"
              caption="Password"
              validate={val.passwordValidator}
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
                  Sign In
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

export default compose(connect(mapStateToProps, actions))(Login);
