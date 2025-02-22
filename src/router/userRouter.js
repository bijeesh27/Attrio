const express = require("express");
const router = express.Router();
const userController = require("../controller/user/userController");
const {
  ifLogged,
  ifLoggedOut,
  ifBlocked,
  logged,
} = require("../middleware/userMiddleware");

// Public Routes (accessible only if not logged in)
router.get("/login", ifLogged, userController.loadLogin);
router.post("/login", userController.login);
router.get("/register", ifLogged, userController.loadRegister);
router.post("/register", userController.register);
router.get("/forgot", userController.loadForgotEmailverification);
router.post("/forgot", userController.forgot);
router.get("/otp", userController.loadOtp);
router.get("/", userController.loadHome);
router.get("/shop", userController.loadCategory);
router.get("/productPage", userController.loadProductPage);

// Private Routes (accessible only if logged in)
router.get("/profile", logged, userController.loadProfile);
router.get("/logout", userController.logout);

module.exports = router;
