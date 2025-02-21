const express = require("express");
const router = express.Router();
const userController = require("../controller/userController");
const { ifLogged } = require("../middleware/userMiddleware");

router.get("/",ifLogged, userController.loadHome);
router.get("/login", userController.loadLogin);
router.post("/login", userController.login);
router.get("/register", userController.loadRegister);
router.post("/register", userController.register);
router.get("/shop", userController.loadCategory);
router.get("/productPage", userController.loadProductPage);
router.get("/forgot", userController.loadForgotEmailverification);
router.post("/forgot", userController.forgot);
router.get("/otp", userController.loadOtp);
// router.get("/otp",userController.generateOtp)

module.exports = router;
