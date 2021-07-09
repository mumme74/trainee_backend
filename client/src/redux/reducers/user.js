import {
  USER_INFO_CLEARED,
  USER_INFO_ERROR,
  USER_INFO_SET,
} from "../actions/types";

const DEFAULT_STATE = {
  userName: "",
  firstName: "",
  lastName: "",
  email: "",
  picture: "",
  method: "",
  googleId: "",
  error: {},
};

export default function userReducer(state = DEFAULT_STATE, action) {
  switch (action.type) {
    case USER_INFO_SET:
      let st = { ...state };
      for (const [key, value] of Object.entries(action.payload)) {
        st[key] = value;
      }
      return st;
    case USER_INFO_CLEARED:
      return {
        ...DEFAULT_STATE,
      };
    case USER_INFO_ERROR:
      return {
        ...DEFAULT_STATE,
        error: action.payload,
      };
    default:
      return state;
  }
}
