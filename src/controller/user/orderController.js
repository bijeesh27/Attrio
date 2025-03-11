const User=require('../../models/userSchema')
const Cart=require("../../models/cartSchema")


const loadCheckout=async (req,res) => {
    try {
        const user=await User.findOne({_id:req.session.userId})
        const cart=await Cart.findOne({userId:req.session.userId}).populate("item.productId", "name image");
        return res.render('checkout',{user,cart})
    } catch (error) {
        console.log(error);
    }
}

const loadPlaceOrder=async (req,res) => {
    try {
       const orderNumber={}
       const paymentMethod={}
       const shippingAddress={}
       const subtotal={}
       const grandTotal={}
       const discount={}
       const user=await User.findOne({_id:req.session.userId})
       const cart=await Cart.findOne({userId:req.session.userId}).populate("item.productId", "name image");
        return res.render('placeorder',{orderNumber,user,cart,paymentMethod,shippingAddress,subtotal,grandTotal,discount})
    } catch (error) {
        console.log(error);
    }
}



module.exports={
    loadCheckout,
    loadPlaceOrder

}