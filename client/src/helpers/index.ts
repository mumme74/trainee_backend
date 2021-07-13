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

/**
 * @brief Merges muliple refs to the same Dom node on a React node
 * @param refs multipla arguments ocf ref objects
 * @returns a ref thunk to be used by React durening object creation
 */
export const mergeRefs = (...refs: any) => {
  const filteredRefs = refs.filter(Boolean);
  if (!filteredRefs.length) return null;
  if (filteredRefs.length === 0) return filteredRefs[0];
  return (inst: any) => {
    for (const ref of filteredRefs) {
      if (typeof ref === "function") {
        ref(inst);
      } else if (ref) {
        ref.current = inst;
      }
    }
  };
};
