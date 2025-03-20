const express = require("express");
const router = express.Router();
const adminController = require("../controller/admin/adminController");
const productController=require("../controller/admin/productController")
const categoryController=require("../controller/admin/categoryController")
const userController=require("../controller/admin/userController")
const orderController=require("../controller/admin/orderController")
const couponController=require('../controller/admin/couponController')
const offerController=require('../controller/admin/offerController')
const multer=require("multer");
const { isAdmin, isAdminLogged } = require("../middleware/adminMiddleware");
const { logged } = require("../middleware/userMiddleware");
const upload = multer({ dest: 'uploads/' })


router.get("/",isAdmin, adminController.loadDashboard);
router.get("/login",isAdminLogged,adminController.loadLogin);
router.post("/login",adminController.login)
router.get("/add-product",isAdmin, productController.loadAddProduct);
router.post("/add-product",upload.array("images"),isAdmin,productController.addProduct);
router.get("/edit-product/:productId",isAdmin, productController.loadEditProduct);
router.post("/edit-product/:productId",upload.array("images"),isAdmin,productController.editProduct);
router.get("/categories",isAdmin, categoryController.loadCategories);
router.get("/user",isAdmin, userController.loadUser);
router.get("/products",isAdmin, productController.loadProducts);
router.get("/block/:userId",isAdmin, userController.blockUser);
router.get("/add-category",isAdmin,categoryController.loadAddCategory)
router.post('/add-category',isAdmin,categoryController.addCategory)
router.get("/blockCategory/:categoryId",isAdmin,categoryController.blockCategory)
router.get("/editCategory/:categoryId",isAdmin,categoryController.loadEditCategory)
router.post("/editCategory/:categoryId",isAdmin,categoryController.editCategory)
router.get("/blockProduct/:productId",isAdmin,productController.blockProduct)
router.get("/orders",isAdmin,orderController.loadOrders)
router.post('/updateorderstatus',isAdmin,orderController.updateOrderStatus)
router.post('/updateproductstatus',isAdmin,orderController.updateProductStatus)
router.post('/updatereturn',isAdmin,orderController.updateReturn)
router.get('/adminorderdetails/:orderId',isAdmin,orderController.loadOrderdetails)
router.get('/coupon',isAdmin,couponController.loadCoupon)
router.get('/addcoupon',isAdmin,couponController.loadAddCoupon)
router.post('/addcoupon',isAdmin,couponController.addCoupon)
router.get('/editcoupon/:couponId',isAdmin,couponController.editCoupon)
router.post('/blockcoupon/:couponId',isAdmin,couponController.blockCoupon)
router.post('/updatecoupon/:couponId',isAdmin,couponController.updateCoupon)
router.get('/offer',isAdmin,offerController.loadOffer)
router.get('/addoffer',isAdmin,offerController.loadAddOffer)
router.post('/addoffer',isAdmin,offerController.addOffer)



router.get("/search",isAdmin,userController.loadUser)
router.get("/productsearch",isAdmin,productController.loadProducts)
router.get('/categorysearch',isAdmin,categoryController.loadCategories)
router.get("/ordersearch",isAdmin,orderController.loadOrders)
router.get("/new-arrivals")
router.get("/logout",adminController.logout)

module.exports = router;
