import { SIDEMENU_SET_IS_SHOWN, SIDEMENU_TOGGLE } from "../actions/types";
import { AnyAction } from "redux";

const DEFAULT_STATE = {
  isShown: false,
};

export default function sidemenuReducer(
  state = DEFAULT_STATE,
  action: AnyAction
) {
  switch (action.type) {
    case SIDEMENU_SET_IS_SHOWN:
      return {
        ...state,
        isShown: action.payload,
      };
    case SIDEMENU_TOGGLE:
      return {
        ...state,
        isShown: !state.isShown,
      };
    default:
      return state;
  }
}
