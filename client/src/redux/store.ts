import { compose } from "redux";
import { configureStore } from "@reduxjs/toolkit";

import reduxThunk from "redux-thunk";
import reducers from "./reducers";
import { AUTH_SIGN_UP } from "./actions/types";
import { refreshUserInfo } from "./actions";
import { DEV_MODE } from "../config/config";
import { isTokenValid } from "../helpers";

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
  const jwtToken = localStorage.getItem("JWT_TOKEN") + "";

  if (isTokenValid(jwtToken)) {
    store.dispatch({ type: AUTH_SIGN_UP, payload: jwtToken });
    setTimeout(() => {
      refreshUserInfo()(store.dispatch);
    }, 5); // do after axios is initialized
  }

  return store;
}

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;

export type StoreType = typeof store;
