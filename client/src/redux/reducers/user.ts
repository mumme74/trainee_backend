import { AnyAction } from "redux";
import {
  USER_INFO_CLEARED,
  USER_INFO_ERROR,
  USER_INFO_SET,
  USER_INFO_CLEAR_ERROR,
  IUser,
} from "../actions/types";

const DEFAULT_STATE: IUser = {
  id: "",
  userName: "",
  firstName: "",
  lastName: "",
  email: "",
  picture: "",
  method: "",
  googleId: "",
  error: {},
};

export default function userReducer(state = DEFAULT_STATE, action: AnyAction) {
  switch (action.type) {
    case USER_INFO_SET:
      let st: IUser = { ...state };
      type K = keyof IUser;
      for (const key in action.payload as IUser) {
        if (action.payload.hasOwnProperty(key))
          st[key as K] = action.payload[key];
      }
      return st;
    case USER_INFO_CLEARED:
      return {
        ...DEFAULT_STATE,
      };
    case USER_INFO_CLEAR_ERROR:
      return {
        ...state,
        error: {},
      };
    case USER_INFO_ERROR:
      return {
        ...state,
        error: action.payload,
      };
    default:
      return state;
  }
}
