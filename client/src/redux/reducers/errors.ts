import {
  ERROR_AUTENTICATION_EXPIRED,
  ERROR_COMMUNICATION,
  ERROR_COMMUNICATION_CLEAR,
} from "../actions/types";
import { AnyAction } from "redux";

export interface IError extends Error {
  type: string;
}

type StateT = {
  unauthenticated: false;
  errors: [IError?];
};

const DEFAULT_STATE: StateT = {
  unauthenticated: false,
  errors: [],
};

export function errorReducer(state = DEFAULT_STATE, action: AnyAction) {
  switch (action.type) {
    case ERROR_COMMUNICATION:
      const payload = action.payload as IError;
      payload.type = action.type;
      const ret = <StateT>{
        ...state,
      };
      ret.errors.push(payload);
      return ret;
    case ERROR_COMMUNICATION_CLEAR:
      return <StateT>{
        ...state,
        errors: [],
      };
    case ERROR_AUTENTICATION_EXPIRED:
      return <StateT>{
        ...state,
        unauthenticated: !!action.payload,
      };
    default:
      return state;
  }
}
