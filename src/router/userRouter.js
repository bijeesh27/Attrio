const express = require("express");
const router = express.Router();
const userController = require("../controller/user/userController");
const productController = require("../controller/user/productController");
const categoryController = require("../controller/user/categoryController");
const passport = require("../config/passport");
const { ifLogged, logged } = require("../middleware/userMiddleware");

// Public Routes (accessible only if not logged in)
router.get("/login", ifLogged, userController.loadLogin);
router.post("/login", userController.login);
router.get("/register", ifLogged, userController.loadRegister);
router.post("/register", userController.register);
router.get("/forgot", userController.loadForgotEmailverification);
router.post("/forgot", userController.forgot);
router.get("/otp", userController.loadOtp);
router.post("/verify-otp", userController.verifyOtp);
router.get("/", userController.loadHome);
router.get("/shop", productController.loadShop);
router.get("/shopsingle/:productId", productController.loadShopSingle);
router.get("/catfilter/:categoryId", productController.findByCategory);
router.get("/singleproduct/:productId", productController.singleProduct);

// Private Routes (accessible only if logged in)
router.get("/profile", logged, userController.loadProfile);
router.get("/logout", userController.logout);

router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/register" }),
  (req, res) => {
    req.session.isAuth = true;
    res.redirect("/");
  }
);

module.exports = router;
