import { COMMUNICATION_CNT } from "./types";
import { AppDispatch } from "../store";

export const startCommunication = () => {
  return (dispatch: AppDispatch) => {
    dispatch({
      type: COMMUNICATION_CNT,
      payload: +1,
    });
  };
};

export const endCommunication = () => {
  return (dispatch: AppDispatch) => {
    dispatch({
      type: COMMUNICATION_CNT,
      payload: -1,
    });
  };
};
