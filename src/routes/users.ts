import PromiseRouter from "express-promise-router";
import {
  Express, Request,
  Response, NextFunction, Router
} from "express";
import UsersController, {
   IUsersController
} from "../controllers/users";
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
import { eRolesAvailable } from "../models/role";

function userRoutes(
  router: Router,
  // pass in controller to ba able to mock when testing
  controller: IUsersController = UsersController,
) {
  const usersRouter = PromiseRouter();
  router.use("/users", usersRouter);

  usersRouter.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    next();
  });

  usersRouter
    .route("/signup")
    .post(validateBody(schemas.newUserSchema), controller.signup);

  usersRouter
    .route("/login")
    .post(validateBody(schemas.loginSchema), passportLogin, controller.login);

  usersRouter.route("/oauth/google").post(passportGoogle, controller.googleOAuthOk);

  usersRouter.route("/myinfo").get(passportJWT, controller.myInfo);

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
      controller.changeMyPassword,
    );

  usersRouter.route("/secret").get(passportJWT, controller.secret);

  usersRouter
    .route("/deletemyself")
    .post(
      passportJWT,
      validateBody(schemas.deleteMySelfSchema),
      controller.deleteMyself,
    );

  usersRouter
    .route("/availableroles")
    .get(
      passportJWT,
      hasRoles({ anyOf: [eRolesAvailable.admin, eRolesAvailable.super] }),
      controller.rolesAvailable,
    );

  return usersRouter;
}

export default userRoutes;
