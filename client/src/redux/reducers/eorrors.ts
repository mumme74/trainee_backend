import { ERROR_COMMUNICATION } from "../actions/types";
import { AnyAction } from "redux";

const DEFAULT_STATE = {
  type: "",
  error: typeof Error,
};

export function errorReducer(state = DEFAULT_STATE, action: AnyAction) {
  switch (action.type) {
    case ERROR_COMMUNICATION:
      return {
        ...state,
        type: action.type,
        error: action.payload,
      };
    default:
      return state;
  }
}
