// authenticate types
export const AUTH_SIGN_UP = "AUTH_SIGN_UP";
export const AUTH_ERROR = "AUTH_FAIL";
export const AUTH_SIGN_OUT = "AUTH_SIGN_OUT";
export const AUTH_SIGN_IN = "AUTH_SIGN_IN;";

// user types
export const USER_INFO_SET = "USER_INFO_SET";
export const USER_INFO_CLEARED = "USER_INFO_CLEARED";
export const USER_INFO_ERROR = "USER_INFO_ERROR";
export const USER_INFO_CLEAR_ERROR = "USER_INFO_CLEAR_ERROR";

// currently stale, for user form
export const UPDATE_FORM_STATE =
  "final-form-redux-example/finalForm/UPDATE_FORM_STATE";

// dashboard
export const DASHBOARD_GET_DATA = "DASHBOARD_GET_DATA";

interface IUserBase {
  userName: string;
  firstName: string;
  lastName: string;
  email: string;
  picture: string;
  method: string;
  googleId?: string;
  hd?: string;
  error: { message?: string; error?: Error };
}
export interface ISignUpNewUserForm extends IUserBase {
  password: string;
}

export interface IUser extends IUserBase {
  id: string;
}

export interface IDashboard {
  secret: string;
}

export interface ILoginForm {
  login: string;
  password: string;
}

export interface IAuth {
  isAuthenticated: boolean;
  token: string;
  error: { message?: string; error?: Error };
}
