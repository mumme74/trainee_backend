import PromiseRouter from "express-promise-router";
import {
  Request,
  Response,
  NextFunction,
  Router
} from "express";
import UsersController, {
   IUsersController
} from "../controllers/user.controller";
import {
  passportGoogle,
  passportLogin,
  passportJWT
} from "../passport";

import {
  validateBody,
  schemas,
  hasRoles
} from "../helpers/routeHelpers";
import { eRolesAvailable } from "../models/core_role";
import { jsonHeaders } from "../middlewares/json.headers.middleware";

export default function userRoutes(
  router: Router,
  // pass in controller to ba able to mock when testing
  controller: IUsersController = UsersController,
) {
  const usersRouter = PromiseRouter();
  router.use("/users", usersRouter);
  usersRouter.use(jsonHeaders);


  usersRouter
    .route("/myinfo")
    .get(
      passportJWT,
      controller.myInfo);

  usersRouter
    .route("/savemyuserinfo")
    .post(
      passportJWT,
      validateBody(schemas.saveMyUserInfoSchema),
      controller.saveMyUserInfo,
    );

  usersRouter
    .route("/changemypassword")
    .post(
      passportJWT,
      validateBody(schemas.passwordSchema),
      controller.changeMyPassword);

  usersRouter
    .route("/secret")
    .get(
      passportJWT,
      controller.secret);

  usersRouter
    .route("/deletemyself")
    .post(
      passportJWT,
      validateBody(schemas.deleteMySelfSchema),
      controller.deleteMyself);

  usersRouter
    .route("/availableroles")
    .get(
      passportJWT,
      hasRoles({ anyOf: [eRolesAvailable.admin, eRolesAvailable.super] }),
      controller.rolesAvailable,
    );

  return usersRouter;
}
