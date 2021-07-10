import { UPDATE_FORM_STATE, ILoginForm } from "../actions/types";
import { AnyAction } from "redux";

const INITIAL_STATE: ILoginForm = {
  login: "",
  password: "",
};

// Reducer
const formReducer = (state: ILoginForm = INITIAL_STATE, action: AnyAction) => {
  switch (action.type) {
    case UPDATE_FORM_STATE:
      return {
        ...state,
        [action.form]: action.payload,
      };
    default:
      return state;
  }
};

export default formReducer;
