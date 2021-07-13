import axios from "axios";
import { store } from "./redux/store";
import {
  startCommunication,
  endCommunication,
} from "./redux/actions/communication";
import {
  setCommuncationError,
  setAuthenticationExpired,
} from "./redux/actions";

/**
 * @brief initializes defaults and sets up request/response sniffers
 *        Must be called after redux store is initialized.
 */
export function initAxios() {
  const jwt = store.getState().auth.token;
  if (jwt) axios.defaults.headers.common["Authorization"] = jwt;

  // set up on request action on axios
  axios.interceptors.request.use((config) => {
    startCommunication()(store.dispatch);
    return config;
  });

  // set up response sniffer
  axios.interceptors.response.use(
    (response) => {
      endCommunication()(store.dispatch);
      return response;
    },
    (error) => {
      if (error?.response?.status === 401) {
        setAuthenticationExpired()(store.dispatch);
      }
      const err = error?.response?.data || error;
      setCommuncationError(err)(store.dispatch);

      endCommunication()(store.dispatch);

      return Promise.reject(error);
    }
  );
}
