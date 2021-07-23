import { COMMUNICATION_CNT } from "../actions/types";
import { AnyAction } from "redux";

const DEFAULT_STATE = {
  activeReqCnt: 0,
  progress: 0.0,
};

export default function communicationReducer(
  state = DEFAULT_STATE,
  action: AnyAction,
) {
  switch (action.type) {
    case COMMUNICATION_CNT:
      return {
        ...state,
        activeReqCnt: state.activeReqCnt + action.payload, // if payload negative it decrements
      };
    default:
      return state;
  }
}
