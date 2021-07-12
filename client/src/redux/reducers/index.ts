import { combineReducers } from "redux";
import formReducer from "./formReducer";
import authReducer from "./auth";
import userReducer from "./user";
import sidemenuReducer from "./sidemenu";
import { dashboardReducer } from "./dashboardReducer";

export default combineReducers({
  form: formReducer,
  auth: authReducer,
  user: userReducer,
  dash: dashboardReducer,
  sidemenu: sidemenuReducer,
});
