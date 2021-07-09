import Router from "express-promise-router";
import UsersController from "../controllers/users";
import passport  from "passport";
import "../passport";

import { validateBody, schemas }  from "../helpers/routeHelpers";


const router = Router();
const passportSignIn = passport.authenticate("local", { session: false });
const passportJWT = passport.authenticate("jwt", { session: false });
const passportGoogle = passport.authenticate("google-verify-token", { session: false});


router
  .route("/signup")
  .post(validateBody(schemas.newUserSchema), UsersController.signup);

router
  .route("/login")
  .post(
    validateBody(schemas.loginSchema),
    passportSignIn,
    UsersController.login
  );

router
  .route("/oauth/google")
  .post(passportGoogle, UsersController.googleOAuthOk);

router.route("/myinfo").get(passportJWT, UsersController.myInfo);

router.route("/secret").get(passportJWT, UsersController.secret);

module.exports = router;
