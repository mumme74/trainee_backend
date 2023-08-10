import PromiseRouter from "express-promise-router";
import {
  Request,
  Response,
  NextFunction,
  Router
} from "express";
import AuthController, {
  IAuthController
} from "../controllers/auth.controller";
import {
  passportGoogle,
  passportJWT,
  passportLogin
} from "../passport";
import {
  validateBody,
  schemas,
  hasRoles
} from "../helpers/routeHelpers";
import { eRolesAvailable } from "../models/core_role";
import { jsonHeaders } from "../middlewares/json.headers.middleware";

export default function authRoutes(
  router: Router,
  controller: IAuthController = AuthController
) {
  const authRouter = PromiseRouter();
  router.use("/auth", authRouter);
  authRouter.use(jsonHeaders);

  authRouter
  .route("/signup")
  .post(
    validateBody(schemas.newUserSchema),
    controller.signup);

  authRouter
    .route("/login")
    .post(
      validateBody(schemas.loginSchema),
      passportLogin,
      controller.login);

  authRouter
    .route("/logout")
    .post(
      passportJWT,
      controller.logout);

  authRouter
    .route("/refreshLogin")
    .post(
        passportJWT,
        controller.refreshLogin);

  authRouter
    .route("/invalidateUserTokens")
      .post(
        passportJWT,
        controller.invalidateUserTokens);

  authRouter
    .route("/invalidateAllTokens")
    .post(
      passportJWT,
      controller.invalidateAllTokens);

  authRouter
    .route("/requestPasswordReset")
    .post(
      validateBody(schemas.requestPwdReset),
      controller.requestPasswordReset);

  authRouter
    .route("/setPasswordOnReset")
    .post(
      validateBody(schemas.setPwdOnReset),
      controller.setPasswordOnReset);

  authRouter
    .route("/oauth/google")
    .post(
      passportGoogle,
      controller.googleOAuthOk);
}