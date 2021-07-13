import { ERROR_COMMUNICATION, ERROR_AUTENTICATION_EXPIRED } from "./types";
import { AppDispatch } from "../store";

export const setCommuncationError = (error: Error | string) => {
  return (dispatch: AppDispatch) => {
    if (typeof error === "string") error = new Error(error);

    dispatch({
      type: ERROR_COMMUNICATION,
      payload: error,
    });
  };
};

export const setAuthenticationExpired = () => {
  return (dispatch: AppDispatch) => {
    dispatch({ type: ERROR_AUTENTICATION_EXPIRED, payload: true });
  };
};

export const clearAuthenticationExpired = () => {
  return (dispatch: AppDispatch) => {
    dispatch({ type: ERROR_AUTENTICATION_EXPIRED, payload: false });
  };
};
