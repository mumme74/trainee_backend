import { AnyAction } from "redux";
import { DASHBOARD_GET_DATA, IDashboard } from "../actions/types";

const DEFAULT_STATE: IDashboard = {
  secret: "",
};

export function dashboardReducer(
  state: IDashboard = DEFAULT_STATE,
  action: AnyAction
) {
  switch (action.type) {
    case DASHBOARD_GET_DATA:
      return {
        ...state,
        secret: action.payload,
      };
    default:
      return state;
  }
}
