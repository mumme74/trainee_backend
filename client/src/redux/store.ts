import { compose } from "redux";
import { configureStore } from "@reduxjs/toolkit";

import reduxThunk from "redux-thunk";
import axios from "axios";

import reducers from "./reducers";
import { AUTH_SIGN_UP } from "./actions/types";
import { refreshUserInfo } from "./actions";
import { DEV_MODE } from "../config/config";

declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: typeof compose;
  }
}

export const store = configureStore({
  reducer: reducers,
  middleware: [reduxThunk],
  devTools: DEV_MODE,
});

// should only be called from main index.js
export function initStore() {
  // authenticated from localStorage
  const jwtToken = localStorage.getItem("JWT_TOKEN");
  store.dispatch({ type: AUTH_SIGN_UP, payload: jwtToken });
  if (jwtToken) {
    axios.defaults.headers.common["Authorization"] = jwtToken;
    refreshUserInfo()(store.dispatch);
  }

  return store;
}

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
