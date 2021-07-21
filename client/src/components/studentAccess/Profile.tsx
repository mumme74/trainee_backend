import React, { useState } from "react";
import { connect } from "react-redux";
import { compose } from "redux";
import { Form, Field } from "react-final-form";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation("core");

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
          {t("student_access_profile_google_managed")}
        </div>
      )}
      <Form onSubmit={saveUserInfo} initialValues={props.user}>
        {({ handleSubmit, pristine, form, submitting }) => (
          <form onSubmit={handleSubmit} className="container p-2">
            <div className="row">
              <div className="col-sm-2"></div>
              <h3 className="col-sm">{t("student_access_profile_header")}</h3>
            </div>
            <Field
              name="userName"
              type="text"
              caption={t("username")}
              readonly={true}
              component={FormRow}
            />
            <Field
              name="firstName"
              type="text"
              readonly={locked}
              caption={t("firstname")}
              validate={val.required}
              component={FormRow}
            />
            <Field
              name="lastName"
              type="text"
              caption={t("lastname")}
              readonly={locked}
              validate={val.required}
              component={FormRow}
            />
            <Field
              name="email"
              type="email"
              caption={t("email")}
              readonly={locked}
              validate={val.emailValidator}
              component={FormRow}
            />
            <Field
              name="picture"
              type="text"
              caption={t("student_access_profile_picture")}
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
                  {t("save")}
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
        {showPw
          ? t("student_access_profile_hide_password")
          : t("student_access_profile_show_password")}
      </button>{" "}
      <Link to="/deleteme" className="m-5 text-small text-secondary">
        {t("student_access_profile_remove_from_system")}
      </Link>
      {showPw && (
        <Form
          onSubmit={changePassword}
          validate={(values: { confirm: string; password: string }) => {
            return values.confirm !== values.password
              ? { confirm: t("password_must_match") }
              : {};
          }}
        >
          {({ handleSubmit, pristine, form, submitting }) => (
            <form onSubmit={handleSubmit} className="container p-2">
              <div className="row">
                <div className="col-sm-2"></div>
                <h3 className="col-sm">{t("change_password")}</h3>
              </div>
              <Field
                name="password"
                type="password"
                caption={t("password")}
                validate={val.passwordValidator}
                component={FormRow}
              />
              <Field
                name="confirm"
                type="password"
                caption={t("confirm")}
                placeholder={t("confirm_password")}
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
                    {t("change_password")}
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
