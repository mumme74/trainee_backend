import { createStore, applyMiddleware, compose } from "redux";

import { createLogger } from "redux-logger";
import reduxThunk from "redux-thunk";
import axios from "axios";

import reducers from "./reducers";
import { AUTH_SIGN_UP } from "./actions/types";
import {refreshUserInfo} from './actions'

const composeEnhancers =
  typeof window === "object" && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
    ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
    : compose;

let store;
// should only be called from main index.js
export default function initStore() {
  store = createStore(
    reducers,
    {},
    composeEnhancers(applyMiddleware(reduxThunk, createLogger()))
  );

  // authenticated from localStorage
  const jwtToken = localStorage.getItem("JWT_TOKEN");
  store.dispatch({ type: AUTH_SIGN_UP, payload: jwtToken });
  if (jwtToken) {
      axios.defaults.headers.common["Authorization"] = jwtToken;
      store.dispatch(refreshUserInfo());
  }

  return store;
}

export function get(objName) {
    return store.getState()[objName]
}
