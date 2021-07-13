import { store, AppDispatch, RootState } from "../redux/store";
import {
  setCommuncationError,
  setAuthenticationExpired,
} from "../redux/actions";

/**
 * @brief determine authenticated state from expiration time in jwt
 * @returns boolean true if tokens exp field is still valid
 */
export function isAuthenticated(): boolean {
  const jwt = store.getState().auth.token;
  return isTokenValid(jwt);
}

/**
 * @brief checks if token is valid regaring expiration time and issue time
 * @param jwt a JSON web token
 * @returns true if valid
 */
export function isTokenValid(jwt: string): boolean {
  try {
    const parts = jwt.split(".");
    if (parts.length !== 3) return false;

    const payload = parts[1];
    if (!payload) return false;

    const decoded = window.atob(payload);
    const json = JSON.parse(decoded);
    if (!json.exp || !json.iat) return false;

    // ensure time is correct on client browser
    const currTime = Math.floor(new Date().getTime() / 1000);
    if (json.iat > currTime + 10 * 60) {
      // +- 10 min
      setCommuncationError(new Error("Clock out of sync with server"))(
        store.dispatch
      );
      return false;
    }

    if (json.exp < currTime) {
      setAuthenticationExpired()(store.dispatch);
      return false;
    }

    return true;
  } catch (err) {
    /* squelsh */
  }

  return false;
}
