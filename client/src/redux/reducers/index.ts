import { combineReducers } from "redux";
import formReducer from "./formReducer";
import authReducer from "./auth";
import userReducer from "./user";
import sidemenuReducer from "./sidemenu";
import { dashboardReducer } from "./dashboardReducer";
import communicationReducer from "./communication";
import { errorReducer } from "./errors";

export default combineReducers({
  form: formReducer,
  auth: authReducer,
  user: userReducer,
  dash: dashboardReducer,
  sidemenu: sidemenuReducer,
  communication: communicationReducer,
  error: errorReducer,
});
