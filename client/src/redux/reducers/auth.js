import {
  AUTH_ERROR,
  AUTH_SIGN_UP,
  AUTH_SIGN_IN,
  AUTH_SIGN_OUT,
} from "../actions/types";

const DEFAULT_STATE = {
  isAuthenticated: false,
  token: "",
  error: {},
};

function authReducer(state = DEFAULT_STATE, action) {
  switch (action.type) {
    case AUTH_SIGN_IN:
    case AUTH_SIGN_UP: // fallthrough
      console.log("AuthReducer called");
      return {
        ...state,
        token: action.payload,
        isAuthenticated: !!action.payload,
        error: {},
      };
    case AUTH_ERROR:
      console.log("AuthFail reducer err:", action.payload);
      return {
        ...state,
        error: action.payload,
        isAuthenticated: false,
        token: "",
      };
    case AUTH_SIGN_OUT:
      console.log("AuthSignout reducer called");
      return {
        ...state,
        token: "",
        isAuthenticated: false,
        error: { message: action.payload },
      };
    default:
      return state;
  }
}

export default authReducer;
