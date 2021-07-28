import Router from "express-promise-router";
import type { Express } from "express";
import UsersController, { IUsersController } from "../controllers/users";
import { passportGoogle, passportSignIn, passportJWT } from "../passport";

import { validateBody, schemas, hasRoles } from "../helpers/routeHelpers";
import { rolesAvailable } from "../models/usersModel";

function userRoutes(
  app: Express,
  controller: IUsersController = UsersController,
) {
  const router = Router();
  app.use("/users/", router);

  router
    .route("/signup")
    .post(validateBody(schemas.newUserSchema), controller.signup);

  router
    .route("/login")
    .post(validateBody(schemas.loginSchema), passportSignIn, controller.login);

  router.route("/oauth/google").post(passportGoogle, controller.googleOAuthOk);

  router.route("/myinfo").get(passportJWT, controller.myInfo);

  router
    .route("/savemyuserinfo")
    .post(
      passportJWT,
      validateBody(schemas.saveMyUserInfoSchema),
      controller.saveMyUserInfo,
    );

  router
    .route("/changemypassword")
    .post(
      passportJWT,
      validateBody(schemas.passwordSchema),
      controller.changeMyPassword,
    );

  router.route("/secret").get(passportJWT, controller.secret);

  router
    .route("/deletemyself")
    .post(
      passportJWT,
      validateBody(schemas.deleteMySelfSchema),
      controller.deleteMyself,
    );

  router
    .route("/availableroles")
    .get(
      passportJWT,
      hasRoles([rolesAvailable.admin, rolesAvailable.super]),
      controller.rolesAvailable,
    );

  return router;
}

export default userRoutes;
