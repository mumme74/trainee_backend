import Router from "express-promise-router";
import type { Express, Request, Response, NextFunction } from "express";
import UsersController, { IUsersController } from "../controllers/users";
import { passportGoogle, passportLogin, passportJWT } from "../passport";

import { validateBody, schemas, hasRoles } from "../helpers/routeHelpers";
import { eRolesAvailable } from "../models/usersModel";

function userRoutes(
  app: Express,
  controller: IUsersController = UsersController,
) {
  const router = Router();
  app.use("/users/", router);

  router.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    next();
  });

  router
    .route("/signup")
    .post(validateBody(schemas.newUserSchema), controller.signup);

  router
    .route("/login")
    .post(validateBody(schemas.loginSchema), passportLogin, controller.login);

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
      hasRoles({ anyOf: [eRolesAvailable.admin, eRolesAvailable.super] }),
      controller.rolesAvailable,
    );

  return router;
}

export default userRoutes;
