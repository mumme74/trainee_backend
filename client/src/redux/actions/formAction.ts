import { UPDATE_FORM_STATE, ILoginForm } from "./types";
import { AppDispatch } from "../store";

// Action Creators
export const updateFormState = (data: ILoginForm) => {
  return (dispatch: AppDispatch) => {
    dispatch({
      type: UPDATE_FORM_STATE,
      payload: data,
    });
  };
};
