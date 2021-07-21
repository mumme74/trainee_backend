import React, { useState, useEffect } from "react";
import { Form, Field } from "react-final-form";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation("core");

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
            ? { confirm: t("password_must_match") }
            : {};
        }}
      >
        {({ handleSubmit, pristine, form, submitting }) => (
          <form onSubmit={handleSubmit} className="container p-2">
            <div className="row">
              <div className="col-sm-2"></div>
              <h3 className="col-sm">{t("signup_header")}</h3>
              <p>{t("signup_desc1")}</p>
              <p>{t("signup_desc2")}</p>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setLocked(false);
                }}
              >
                {t("signup_unlock_fields")}
              </button>
            </div>
            <Field
              name="userName"
              type="text"
              caption={t("username")}
              validate={val.userName}
              disabled={locked}
              component={FormRow}
            />
            <Field
              name="firstName"
              type="text"
              caption={t("firstname")}
              validate={val.required}
              disabled={locked}
              component={FormRow}
            />
            <Field
              name="lastName"
              type="text"
              caption={t("lastname")}
              validate={val.required}
              disabled={locked}
              component={FormRow}
            />
            <Field
              name="email"
              type="email"
              caption={t("email")}
              validate={val.emailValidator}
              disabled={locked}
              component={FormRow}
            />
            <Field
              name="password"
              type="password"
              caption={t("password")}
              validate={val.passwordValidator}
              disabled={locked}
              component={FormRow}
            />
            <Field
              name="confirm"
              type="password"
              caption={t("confirm")}
              placeholder={t("confirm_password")}
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
                  {t("signup")}
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
