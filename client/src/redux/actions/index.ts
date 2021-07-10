import axios from "axios";

import { SERVERURL } from "../../config/config";
import { updateFormState } from "./formAction";
import { signUp, logout, login, oAuthGoogle } from "./auth";
import {
  errorUserInfo,
  setUserInfo,
  clearUserInfo,
  refreshUserInfo,
} from "./user";
import { DASHBOARD_GET_DATA } from "./types";
import { AppDispatch } from "../store";

/*
    Flow in redux, from event to store
    ActionCreators -> create/returns Actions({..}) -> dispatch action -> middlewares -> reducers
 */
export function getSecret(path: string) {
  return async (dispatch: AppDispatch) => {
    try {
      const res = await axios.get(`${SERVERURL}${path}`);
      console.log("get secret:", res);

      dispatch({
        type: DASHBOARD_GET_DATA,
        payload: res.data.secret,
      });
    } catch (err) {
      console.error(err);
    }
  };
}

// re-export
export {
  updateFormState,
  // authentication
  signUp,
  logout,
  login,
  oAuthGoogle,
  // user (me)
  errorUserInfo,
  setUserInfo,
  clearUserInfo,
  refreshUserInfo,
};
