const express = require("express");
const router = express.Router();
const adminController = require("../controller/admin/adminController");
const productController = require("../controller/admin/productController");
const categoryController = require("../controller/admin/categoryController");
const userController = require("../controller/admin/userController");
const orderController = require("../controller/admin/orderController");
const couponController = require("../controller/admin/couponController");
const offerController = require("../controller/admin/offerController");
const salesreportController = require("../controller/admin/salesreportController");
const walletController = require("../controller/admin/walletController");
const multer = require("multer");
const { isAdmin, isAdminLogged } = require("../middleware/adminMiddleware");
const { logged } = require("../middleware/userMiddleware");
const upload = multer({ dest: "uploads/" });

// Admin Routes
router.get("/", isAdmin, adminController.loadDashboard);
router.get("/login", isAdminLogged, adminController.loadLogin);
router.post("/login", adminController.login);
router.get("/logout", adminController.logout);

// User Routes
router.get("/user", isAdmin, userController.loadUser);
router.get("/search", isAdmin, userController.loadUser);
router.get("/block/:userId", isAdmin, userController.blockUser);

// Product Routes
router.get("/products", isAdmin, productController.loadProducts);
router.get("/productsearch", isAdmin, productController.loadProducts);
router.get("/add-product", isAdmin, productController.loadAddProduct);
router.post("/add-product", upload.array("images"), isAdmin, productController.addProduct);
router.get("/edit-product/:productId", isAdmin, productController.loadEditProduct);
router.post("/edit-product/:productId", upload.array("images"), isAdmin, productController.editProduct);
router.get("/blockProduct/:productId", isAdmin, productController.blockProduct);


// Category Routes
router.get("/categories", isAdmin, categoryController.loadCategories);
router.get("/categorysearch", isAdmin, categoryController.loadCategories);
router.get("/add-category", isAdmin, categoryController.loadAddCategory);
router.post("/add-category", isAdmin, categoryController.addCategory);
router.get("/editCategory/:categoryId", isAdmin, categoryController.loadEditCategory);
router.post("/editCategory/:categoryId", isAdmin, categoryController.editCategory);
router.get("/blockCategory/:categoryId", isAdmin, categoryController.blockCategory);

// Order Routes
router.get("/orders", isAdmin, orderController.loadOrders);
router.get("/ordersearch", isAdmin, orderController.loadOrders);
router.get("/adminorderdetails/:orderId", isAdmin, orderController.loadOrderdetails);
router.post("/updateorderstatus", isAdmin, orderController.updateOrderStatus);
router.post("/updateproductstatus", isAdmin, orderController.updateProductStatus);
router.post("/updatereturn", isAdmin, orderController.updateReturn);

// Coupon Routes
router.get("/coupon", isAdmin, couponController.loadCoupon);
router.get("/couponsearch", isAdmin, couponController.loadCoupon);
router.get("/addcoupon", isAdmin, couponController.loadAddCoupon);
router.post("/addcoupon", isAdmin, couponController.addCoupon);
router.get("/editcoupon/:couponId", isAdmin, couponController.editCoupon);
router.post("/updatecoupon/:couponId", isAdmin, couponController.updateCoupon);
router.post("/blockcoupon/:couponId", isAdmin, couponController.blockCoupon);

// Offer Routes
router.get("/offer", isAdmin, offerController.loadOffer);
router.get("/offersearch", isAdmin, offerController.loadOffer);
router.get("/add Offer", isAdmin, offerController.loadAddOffer);
router.post("/addoffer", isAdmin, offerController.addOffer);
router.get("/editoffer/:offerId", isAdmin, offerController.loadEditOffer);
router.post("/updateoffer/:offerId", isAdmin, offerController.editOffer);
router.post("/blockoffer/:offerId", isAdmin, offerController.blockOffer);

// Sales Report Routes
router.get("/salesreport", isAdmin, salesreportController.getSalesReport);
router.get("/salesreport/download/pdf", isAdmin, salesreportController.downloadPDF);
router.get("/salesreport/download/excel", isAdmin, salesreportController.downloadExcel);

// Wallet Routes
router.get("/wallet", isAdmin, walletController.getWalletTransactions);

module.exports = router;