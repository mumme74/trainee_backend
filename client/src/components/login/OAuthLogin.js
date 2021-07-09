import React from "react";
import GoogleLogin from "react-google-login";
import { connect } from "react-redux";
import { compose } from "redux";

import { GOOGLE_CLIENT_ID, FACEBOOK_APP_ID } from "../../config/config";
import * as actions from "../../redux/actions";

const FakeFacebookLogin = (props) => {
  return (
    <button className={props.cssClass} onClick={props.callback}>
      Fake Facebook Btn
    </button>
  );
};

function OAuthLogin(props) {
  const responseFacebook = (res) => {
    console.log("response facebook");
  };

  const responseGoogle = async (res) => {
    console.log("response google", res);
    await props.oAuthGoogle(res);
  };

  return (
    <div className="container border-bottom mb-5">
      <div className="row">
        <div className="col-sm-2" />
        <h3 className="col-sm">Sign in using OAuth2</h3>
      </div>
      <div className="row p-2">
        <div className="col-sm-2">{props.error.messsage}</div>
        <GoogleLogin
          clientId={GOOGLE_CLIENT_ID}
          buttonText="Google"
          onSuccess={responseGoogle}
          onFailure={responseGoogle}
          className="btn btn-outline-danger col-sm-2"
        />
        <FakeFacebookLogin
          appId={FACEBOOK_APP_ID}
          autoLoad={true}
          textButton="Facebook"
          fields="name,email,picture"
          callback={responseFacebook}
          cssClass="btn btn-outline-primary col-sm-2"
        />
      </div>
    </div>
  );
}

const mapStateToProps = (state) => {
  return {
    error: state.auth.error,
    isAuthenticated: state.auth.isAuthenticated,
  };
};

export default compose(connect(mapStateToProps, actions))(OAuthLogin);
