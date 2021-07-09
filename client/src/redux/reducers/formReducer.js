import { UPDATE_FORM_STATE } from "../actions/types";

// Reducer
 const formReducer = (state = {}, action = {}) => {
  switch (action.type) {
    case UPDATE_FORM_STATE:
      return {
        ...state,
        [action.form]: action.payload
      }
    default:
      return state
  }
}

export default formReducer;