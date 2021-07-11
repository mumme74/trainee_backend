import axios from "axios";
import { SERVERURL } from "../../config/config";
import {
  USER_INFO_CLEARED,
  USER_INFO_SET,
  USER_INFO_ERROR,
  USER_INFO_CLEAR_ERROR,
  IUser,
} from "./types";
import { AppDispatch } from "../store";

export const refreshUserInfo = () => {
  return async (dispatch: AppDispatch) => {
    try {
      const res = await axios.get(`${SERVERURL}/users/myinfo`);
      return setUserInfo(res.data)(dispatch);
    } catch (err) {
      console.error(err);
      return errorUserInfo(err)(dispatch);
    }
  };
};

export const saveMyUserInfo = (data: IUser) => {
  return async (dispatch: AppDispatch) => {
    try {
      const res = await axios.post(`${SERVERURL}/users/savemyuserinfo`, {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        picture: data.picture,
      });
      return setUserInfo(res.data)(dispatch);
    } catch (err) {
      return errorUserInfo(err)(dispatch);
    }
  };
};

export const changeMyPassword = (data: { password: string }) => {
  return async (dispatch: AppDispatch) => {
    try {
      const res = await axios.post(`${SERVERURL}/users/changemypassword`, data);
      if (res.data.success) return clearUserInfoError()(dispatch);
      return setUserInfo(res.data)(dispatch);
    } catch (err) {
      return errorUserInfo(err)(dispatch);
    }
  };
};

// only sets it locally in the browser
export const setUserInfo = (data: IUser) => {
  return async (dispatch: AppDispatch) => {
    dispatch({
      type: USER_INFO_SET,
      payload: data,
    });
  };
};

// only clears it locally inte browser
export const clearUserInfo = () => {
  return async (dispatch: AppDispatch) => {
    dispatch({
      type: USER_INFO_CLEARED,
      payload: "",
    });
  };
};

export const errorUserInfo = (error: Error) => {
  return async (dispatch: AppDispatch) => {
    dispatch({
      type: USER_INFO_ERROR,
      payload: error,
    });
  };
};

export const clearUserInfoError = () => {
  return async (dispatch: AppDispatch) => {
    dispatch({
      type: USER_INFO_CLEAR_ERROR,
      payload: null,
    });
  };
};
