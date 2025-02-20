const express=require("express")
const router=express.Router();
const userController=require("../controller/userController")

router.get("/",userController.loadHome)
router.get("/login",userController.loadLogin)
router.post("/login",userController.login)
router.get("/register",userController.loadRegister)
router.post("/register",userController.register)



module.exports= router