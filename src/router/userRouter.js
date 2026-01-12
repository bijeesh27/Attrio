const express = require("express");
const router = express.Router();
const userController = require("../controller/user/userController");
const productController = require("../controller/user/productController");
const categoryController = require("../controller/user/categoryController");
const profileController = require("../controller/user/profileController");
const cartController = require("../controller/user/cartController");
const orderController = require("../controller/user/orderController");
const walletController = require("../controller/user/walletController");
const passport = require("../config/passport");
const { ifLogged, logged } = require("../middleware/userMiddleware");
const { upload, cropUpload } = require("../config/profilemulter");

// Authentication Routes
router.get("/register", ifLogged, userController.loadRegister);
router.post("/register", userController.register);
router.get("/login", ifLogged, userController.loadLogin);
router.post("/login", userController.login);
router.get("/logout", userController.logout);

// OTP Verification Routes
router.get("/otp", userController.loadOtp);
router.post("/verify-otp", userController.verifyOtp);
router.get("/resendotp", userController.resendOtp);

// Forgot Password Routes
router.get("/forgot", userController.loadForgotEmailverification);
router.post("/verify-fotp", userController.forgot);
router.get("/verifyfotp", userController.loadvarifyForgotOtp);
router.post("/verifyfotp", userController.verifyForgetOtp);
router.get("/resendfotp", userController.resendForgetOtp);
router.get("/changepassword", userController.loadChangePassword);
router.post("/changepassword", userController.changePassword);

// Public Routes
router.get("/", userController.loadHome);
router.get("/shop", productController.loadShop);
router.get("/shopsingle/:productId", productController.loadShopSingle);
router.get("/singleproduct/:productId", productController.singleProductModal);
router.get("/api/product/:id", productController.productModal);
router.get("/catfilter/:categoryId", productController.findByCategory);
router.get("/search", productController.searchProduct);
router.get("/about", userController.loadAbout);
router.get("/contact", userController.loadContact);

// User Profile Routes (Authenticated)
router.get("/profile", logged, profileController.loadProfile);
router.get("/editprofile", logged, profileController.loadEditprofile);
router.post("/updateprofile", logged, upload.array("images"), profileController.updateProfile);
router.post("/update-profile-image", logged, cropUpload.single("profileImage"), profileController.updateProfileImage);
router.get("/changenewpassword", logged, profileController.loadChangeNewPassword);
router.post("/changenewpassword", logged, profileController.changeNewPassword);
router.post("/send-email-change-otp", logged, profileController.sendEmail);
router.get("/verify-email-change", logged, profileController.veryfyChangeEmail);
router.post("/verify-email-change", logged, profileController.changeEmail);

// Address Routes (Authenticated)
router.get("/address", logged, profileController.loadAddress);
router.get("/addaddress", logged, profileController.loadAddAddress);
router.post("/add-address", logged, profileController.addAddress);
router.get("/editaddress/:addressId", logged, profileController.loadEditAddress);
router.post("/editaddress/:addressId", logged, profileController.editAddress);
router.get("/setdefaultaddress/:addressId", logged, profileController.setDefault);
router.get("/deleteaddress/:addressId", logged, profileController.deleteAddress);

// Cart Routes (Authenticated)
router.get("/cart", logged, cartController.loadCart);
router.post("/addtocart", cartController.addToCart);
router.post("/addTocart", logged, cartController.addTOcart);
router.post("/cart/update", logged, cartController.updateCartQuantity);
router.get("/removeItem/:productId/:size", logged, cartController.removeItem);
router.get("/clearcart", logged, cartController.clearCart);

// Wishlist Routes (Authenticated)
router.get("/wishlist", logged, productController.loadWishlist);
router.post("/addtowishlist", logged, productController.addToWishlist);
router.get("/addingtocart/:productId", logged, productController.addingTocart);
router.delete("/removefromwhishlist/:productId", logged, productController.removeItemWishlist);
router.get("/clearwishlist", logged, productController.clearWishlist);

// Order Routes (Authenticated)
router.get("/checkout", logged, orderController.loadCheckout);
router.post("/addaddressincheckout", logged, productController.addAddressInCheckout);
router.post("/apply-coupon", orderController.applyCoupon);
router.post("/remove-coupon", orderController.removeCoupon);
router.post("/create-order", orderController.createOrder);
router.post("/orderplaced", logged, orderController.placeOrder);
router.get("/placeorder", logged, orderController.loadPlaceOrder);
router.get("/orders", logged, profileController.loadOrder);
router.get("/orderdetails/:orderId", logged, orderController.loadOrderDetails);
router.get("/cancelorder/:orderId", logged, orderController.cancelOrder);
router.get('/cancelItem/:orderId/:productId',logged,orderController.cancelItem)
router.post("/returnorder/:orderId/:productId", logged, orderController.returnOrder);
router.get("/invoice/:orderId", logged, orderController.loadInvoice);
router.post("/update-payment-status", logged, orderController.updatePayment);
router.post("/retry-payment", logged, orderController.retryPayment);
router.get("/order-failure", logged, orderController.loadOrderFailure);
router.post("/addreview", logged, productController.addReview);
router.post('/check-stock', logged, orderController.checkStock);

// Wallet Routes (Authenticated)
router.get("/wallet", logged, profileController.loadWallet);
router.get("/wallet/balance", logged, orderController.walletBalance);
router.post("/wallet/verify-payment", logged, walletController.verifyPayment);
router.post("/wallet/create-order", logged, walletController.createOrder);
router.get("/wallet/transactions", logged, walletController.transactionHistory);

// Google Authentication Routes
router.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/register" }),
  (req, res) => {
    req.session.isAuth = true;
    req.session.email = req.user.email;
    req.session.userId = req.user._id;
    res.redirect("/");
  }
);

module.exports = router;