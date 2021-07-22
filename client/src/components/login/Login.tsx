import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Form, Field } from "react-final-form";
import { connect } from "react-redux";
import { compose } from "redux";
import { History } from "history";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation("core");

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
        {(showForm ? t("hide") : t("show")) + " " + t("login_form")}
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
                <h3 className="col-sm">{t("login")}</h3>
              </div>
              <Field
                name="login"
                type="text"
                caption={t("login")}
                component={FormRow}
              />
              <Field
                name="password"
                type="password"
                caption={t("password")}
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
                    {t("login")}
                  </button>
                  {props.error.message && (
                    <div className="badge bg-danger m-2">
                      {props.error.message}
                    </div>
                  )}
                  <Link className="mx-4" to="/signup">
                    {t("login_sign_up_as_new_user")}
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
