import { SIDEMENU_SET_IS_SHOWN, SIDEMENU_TOGGLE } from "./types";
import { store, AppDispatch } from "../store";

export const setSidemenuIsShown = (show: boolean) => {
  return (dispatch: AppDispatch) => {
    dispatch({
      type: SIDEMENU_SET_IS_SHOWN,
      payload: show,
    });
  };
};

export const toggleSidemenu = () => {
  return (dispatch: AppDispatch) => {
    dispatch({
      type: SIDEMENU_TOGGLE,
      payload: null,
    });
  };
};
