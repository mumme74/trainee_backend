import axios from "axios";

import { AUTH_SIGN_UP, AUTH_ERROR, AUTH_SIGN_OUT, AUTH_SIGN_IN } from "./types";
import { SERVERURL } from "../../config/config";

import { setUserInfo, clearUserInfo } from "./user";

function errorHandler(dispatch, err) {
  console.warn(
    "error response from server",
    err?.response?.data?.error || err?.response || err
  );

  const data = err?.response ? err.response.data : err;
  const status = err?.response ? err.response.status : "";
  const errObj =
    data && Array.isArray(data.details)
      ? data.details[0]
      : {
          message: data.error
            ? data.error.message || data.error
            : `${status} ${data}`,
        };
  dispatch({
    type: AUTH_ERROR,
    payload: errObj,
  });

  localStorage.removeItem("JWT_TOKEN");
  delete axios.defaults.headers.common["Authorization"];
}

function loginHandler(dispatch, responseData, actionType) {
  const token = responseData.access_token;
  if (!token) return errorHandler(new Error("Recieved empty token"));

  dispatch({
    type: actionType,
    payload: token,
  });

  setUserInfo(responseData.user)(dispatch);
  axios.defaults.headers.common["Authorization"] = token;
  localStorage.setItem("JWT_TOKEN", token);
}

// the common code between signUp and login
async function signUpIn(dispatch, data, path, actionType) {
  try {
    console.log("ActionCreator called");

    const res = await axios.post(`${SERVERURL}${path}`, data);
    loginHandler(dispatch, res.data, actionType);
  } catch (err) {
    errorHandler(dispatch, err);
  }
}

export const oAuthGoogle = (data) => {
  return async (dispatch) => {
    try {
      console.log("we recived data", data);

      const res = await axios.post(`${SERVERURL}/users/oauth/google`, {
        access_token: data.tokenId,
      });

      loginHandler(dispatch, res.data, AUTH_SIGN_IN);
    } catch (err) {
      errorHandler(err);
    }
  };
};

export const oAuthFacebook = (data) => {
  return async (dispatch) => {
    try {
      console.log("we recived data", data);

      const res = await axios.post(
        `${SERVERURL}/users/oauth/facebook/saveuser`,
        {
          access_token: data,
        }
      );

      console.log("oath/facebook response:", res);

      setUserInfo(res.data.user)(dispatch);
    } catch (err) {
      errorHandler(err);
    }
  };
};

export const signUp = (data) => {
  /*
    Step 1 use the form data make  http request to send to server [X]
    Step 2 take backend response (jwtToken is here now!) [X]
    Step 3 Dispatch user just signed up with jwtToken [X]
    Step 4 Save the jwtToken into LocalStorage [X]
   */
  return async (dispatch) => {
    const payload = {
      ...data,
      confirm: undefined,
    };
    signUpIn(dispatch, payload, "/users/signup", AUTH_SIGN_UP);
  };
};

export const logout = () => {
  return (dispatch) => {
    localStorage.removeItem("JWT_TOKEN");

    dispatch({
      type: AUTH_SIGN_OUT,
      payload: "",
    });

    clearUserInfo()(dispatch);
  };
};

export const login = (data) => {
  return async (dispatch) => {
    const payload = {
      password: data.password,
      login: data.login,
    };
    signUpIn(dispatch, payload, "/users/login", AUTH_SIGN_IN);
  };
};
