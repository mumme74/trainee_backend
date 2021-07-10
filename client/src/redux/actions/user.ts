import axios from "axios";
import { SERVERURL } from "../../config/config";
import {
  USER_INFO_CLEARED,
  USER_INFO_SET,
  USER_INFO_ERROR,
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

export const setUserInfo = (data: IUser) => {
  return async (dispatch: AppDispatch) => {
    dispatch({
      type: USER_INFO_SET,
      payload: data,
    });
  };
};

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
