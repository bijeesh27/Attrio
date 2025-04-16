const express = require("express");
const router = express.Router();
const userController = require("../controller/user/userController");
const productController = require("../controller/user/productController");
const categoryController = require("../controller/user/categoryController");
const profileController=require('../controller/user/profileController')
const cartController=require('../controller/user/cartController')
const orderController=require('../controller/user/orderController')
const walletController=require('../controller/user/walletController')
const passport = require("../config/passport");
const { ifLogged, logged } = require("../middleware/userMiddleware");
const {upload,cropUpload}=require("../config/profilemulter")
router.post("/register", userController.register);


// Public Routes (accessible only if not logged in)
router.get("/login", ifLogged, userController.loadLogin);
router.post("/login", userController.login);
router.get("/register", ifLogged, userController.loadRegister);



router.get("/otp", userController.loadOtp);
router.post("/verify-otp", userController.verifyOtp);
router.get('/resendotp',userController.resendOtp)
router.get("/", userController.loadHome);
router.get("/shop", productController.loadShop);
router.get("/shopsingle/:productId", productController.loadShopSingle);
router.get("/catfilter/:categoryId", productController.findByCategory);
router.get("/singleproduct/:productId", productController.singleProductModal);
router.get("/api/product/:id",productController.productModal)
router.get('/about',userController.loadAbout)
router.get('/contact',userController.loadContact)
router.get('/search',productController.searchProduct)

//forgot

router.get("/forgot", userController.loadForgotEmailverification);
router.get("/verifyfotp", userController.loadvarifyForgotOtp);
router.post('/verifyfotp',userController.verifyForgetOtp)
router.post("/verify-fotp", userController.forgot);
router.get('/changepassword',userController.loadChangePassword)
router.post('/changepassword',userController.changePassword)
router.get('/resendfotp',userController.resendForgetOtp)



// Private Routes (accessible only if logged in)
router.get("/profile", logged, profileController.loadProfile);
router.get('/orders',logged,profileController.loadOrder)
router.get("/address",logged,profileController.loadAddress)
router.get("/changenewpassword",logged,profileController.loadChangeNewPassword)
router.post('/changenewpassword',logged,profileController.changeNewPassword)
router.get("/editprofile",logged,profileController.loadEditprofile)
router.post("/updateprofile",upload.array("images"),logged,profileController.updateProfile)
router.post("/update-profile-image", logged, cropUpload.single('profileImage'), profileController.updateProfileImage);
router.get("/logout", userController.logout);
router.get('/wallet',logged,profileController.loadWallet)
router.get("/addaddress",logged,profileController.loadAddAddress)
router.post("/addaddressincheckout",logged,productController.addAddressInCheckout)
router.post("/add-address",logged,profileController.addAddress)
router.get('/editaddress/:addressId',logged,profileController.loadEditAddress)
router.post('/editaddress/:addressId',logged,profileController.editAddress)
router.get("/setdefaultaddress/:addressId",logged,profileController.setDefault)
router.get('/deleteaddress/:addressId',logged,profileController.deleteAddress)
router.get("/cart",logged,cartController.loadCart)
router.post("/addtocart",cartController.addToCart)
router.get('/clearcart',logged,cartController.clearCart)
router.get('/removeItem/:productId/:size',logged,cartController.removeItem)
router.post('/cart/update',logged,cartController.updateCartQuantity)
router.get("/checkout",logged,orderController.loadCheckout)
router.post('/remove-coupon', orderController.removeCoupon);
router.post('/apply-coupon', orderController.applyCoupon);
router.post('/orderplaced',logged,orderController.placeOrder)
router.get("/placeorder",logged,orderController.loadPlaceOrder)
router.get("/orderdetails/:orderId",logged,orderController.loadOrderDetails)
router.get('/cancelorder/:orderId',logged,orderController.cancelOrder)
router.post('/returnorder/:orderId/:productId',logged,orderController.returnOrder)
router.get('/invoice/:orderId',logged,orderController.loadInvoice)
router.post('/send-email-change-otp',logged,profileController.sendEmail)
router.get('/verify-email-change',logged,profileController.veryfyChangeEmail)
router.post("/verify-email-change",logged,profileController.changeEmail)
router.post('/create-order', orderController.createOrder);
router.get('/wishlist',logged,productController.loadWishlist)
router.post('/addtowishlist',logged,productController.addToWishlist)
router.get('/addingtocart/:productId',logged,productController.addingTocart)
router.post('/addTocart',logged,cartController.addTOcart)
router.delete('/removefromwhishlist/:productId',logged,productController.removeItemWishlist)
router.get('/clearwishlist',logged,productController.clearWishlist)
router.get('/wallet/balance',logged,orderController.walletBalance)
router.post('/update-payment-status',logged,orderController.updatePayment)
router.post('/retry-payment',logged,orderController.retryPayment)
router.post('/wallet/verify-payment',logged,walletController.verifyPayment)
router.post('/wallet/create-order',logged,walletController.createOrder)

router.get("/order-failure", logged, orderController.loadOrderFailure);

router.get("/auth/google",passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get("/auth/google/callback",passport.authenticate("google", { failureRedirect: "/register" }),
  (req, res) => {
    req.session.isAuth = true;
    req.session.email=req.user.email
    req.session.userId=req.user._id
    res.redirect("/");
  }
);



module.exports = router;
