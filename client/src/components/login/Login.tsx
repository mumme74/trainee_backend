import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Form, Field } from "react-final-form";
import { connect } from "react-redux";
import { compose } from "redux";
import { History } from "history";

import FormRow from "../form/FormRow";
import val from "../form/validators";
import * as actions from "../../redux/actions";
import OAuthLogin from "./OAuthLogin";
import { RootState } from "../../redux/store";
import { IAuth } from "../../redux/actions/types";
import { ILoginData } from "../../redux/actions/auth";

type StatePropsT = {
  error: IAuth["error"];
  isAuthenticated: boolean;
};

type ActionPropsT = {
  login: (data: ILoginData) => void;
  history: History;
};

const Login: React.FC<StatePropsT & ActionPropsT> = (props) => {
  const [showForm, setShowForm] = useState(false);

  const onSubmit = async (formData: ILoginData) => {
    try {
      console.log("submit");
      // we need to call a actionCreator
      props.login(formData);
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
      <button
        className="btn btn btn-info"
        onClick={() => {
          setShowForm(!showForm);
        }}
      >
        {(showForm ? "Hide" : "Show") + " login form"}
      </button>
      {showForm && (
        <Form
          onSubmit={onSubmit}
          validate={(values) => {
            let errObj: { login?: string } = {};
            if (values.login?.length < 3) {
              if (values.login.indexOf("@") > -1) {
                errObj.login = val.userName(values.login);
              } else {
                errObj.login = val.emailValidator(values.login);
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
                  <Link className="mx-4" to="/signup">
                    Sign up as new user
                  </Link>
                </div>
              </div>
            </form>
          )}
        </Form>
      )}
    </React.Fragment>
  );
};

const mapStateToProps = (state: RootState) => {
  return {
    error: state.auth.error,
    isAuthenticated: state.auth.isAuthenticated,
  };
};

export default compose(connect(mapStateToProps, actions))(Login);
