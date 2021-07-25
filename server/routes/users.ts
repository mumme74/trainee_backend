import Router from "express-promise-router";
import UsersController from "../controllers/users";
import { passportGoogle, passportSignIn, passportJWT } from "../passport";

import { validateBody, schemas, hasRoles } from "../helpers/routeHelpers";
import { rolesAvailable } from "../models/usersModel";

const router = Router();

const isAdmin = hasRoles([rolesAvailable.admin]);

router
  .route("/signup")
  .post(validateBody(schemas.newUserSchema), UsersController.signup);

router
  .route("/login")
  .post(
    validateBody(schemas.loginSchema),
    passportSignIn,
    UsersController.login,
  );

router
  .route("/oauth/google")
  .post(passportGoogle, UsersController.googleOAuthOk);

router.route("/myinfo").get(passportJWT, UsersController.myInfo);

router
  .route("/savemyuserinfo")
  .post(
    passportJWT,
    validateBody(schemas.saveMyUserInfoSchema),
    UsersController.saveMyUserInfo,
  );

router
  .route("/changemypassword")
  .post(
    passportJWT,
    validateBody(schemas.passwordSchema),
    UsersController.changeMyPassword,
  );

router.route("/secret").get(passportJWT, UsersController.secret);

router
  .route("/deletemyself")
  .post(
    passportJWT,
    validateBody(schemas.deleteMySelfSchema),
    UsersController.deleteMyself,
  );

router
  .route("/availableroles")
  .get(passportJWT, isAdmin, UsersController.rolesAvailable);

router
  .route("/changeroles")
  .post(passportJWT, isAdmin, UsersController.changeRoles);

export default router;
