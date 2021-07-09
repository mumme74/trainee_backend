// from https://www.youtube.com/watch?v=x_HRoXKo2es&list=PLSpJkDDmpFZ7GowbJE-mvX09zY9zfYatI&index=3
const router = require("express-promise-router")();
const UsersController = require("../controllers/users");
const passport = require("passport");
const passportConf = require("../passport");

const { validateBody, schemas } = require("../helpers/routeHelpers");

const passportSignIn = passport.authenticate("local", { session: false });
const passportJWT = passport.authenticate("jwt", { session: false });

/*const passportGoogleSignIn = passport.authenticate("google", {
  session: false,
  scope: ["profile", "email"],
  failureRedirect: "/users/oauth/google/failure",
});*/
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

/*
router.route("/oauth/google").get(passportGoogleSignIn, (req, res) => {
  console.error("we should be redirected from here!");
  res.json({ msg: "we should get redirected from here, never arrive here" });
});
*/
router
  .route("/oauth/google")
  .post(passportGoogle, UsersController.googleOAuthOk);

router
  .route("/oauth/google/googlebutton")
  .post(UsersController.googleOAuthAuthenticate);

router
  .route("/oauth/facebook")
  .post(
    passport.authenticate("facebookToken", { session: false }),
    UsersController.facebookOAuth
  );

router.route("/oath/google/failure", UsersController.googleOAuthFail);

router.route("/myinfo").get(passportJWT, UsersController.myInfo);

router.route("/secret").get(passportJWT, UsersController.secret);

module.exports = router;
