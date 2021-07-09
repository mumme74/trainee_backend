import axios from "axios";
import { SERVERURL } from "../../config/config";
import { USER_INFO_CLEARED, USER_INFO_SET, USER_INFO_ERROR } from "./types";

 export const refreshUserInfo = () => {
   return async dispatch => {
     try {
       const res = await axios.get(`${SERVERURL}/users/myinfo`);
       return setUserInfo(res.data)(dispatch)

     } catch (err) {
       console.error(err);
       return errorUserInfo(err)(dispatch);
     }
   }
 }

 export const setUserInfo = (data) => {
   return (dispatch) => {
      dispatch({
        type: USER_INFO_SET,
        payload: data
      });     
   }
 }

 export const clearUserInfo = () => {
   return dispatch => {
     dispatch({
       type: USER_INFO_CLEARED,
       payload: ''
     })
   }
 }

 export const errorUserInfo = (error) => {
   return dispatch => {
     dispatch({
       type: USER_INFO_ERROR,
       payload: error
     })
   }
 }