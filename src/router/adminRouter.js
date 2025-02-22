const express = require("express");
const router = express.Router();
const adminController = require("../controller/admin/adminController");

router.get("/", adminController.loadDashboard);
router.get("/add-product", adminController.loadAddProduct);
router.post("/add-product", adminController.addProduct);
router.get("/categories", adminController.loadCategories);
router.get("/user", adminController.loadUser);
router.get("/products", adminController.loadProducts);
router.get("/block/:userId", adminController.blockUser);

module.exports = router;
