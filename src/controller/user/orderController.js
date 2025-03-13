const User=require('../../models/userSchema')
const Cart=require("../../models/cartSchema")
const Address = require('../../models/addressSchema')
const Orders = require('../../models/orderSchema')
const Product = require('../../models/productSchema')


const loadCheckout=async (req,res) => {
    try {
        const user=await User.findOne({_id:req.session.userId})
        const addressDoc = await Address.findOne({ userId:req.session.userId });

        const addresses = addressDoc ? addressDoc.address : [];
        const cart=await Cart.findOne({userId:req.session.userId}).populate("item.productId", "name image");
        return res.render('checkout',{user,cart,addresses})
    } catch (error) {
        console.log(error);
    }
}

const placeOrder=async (req,res) => {
    try {
        const{addressId}=req.body
        console.log("addressId",addressId);
        const userId=req.session.userId
        const cart=await Cart.findOne({userId}).populate("item.productId")
        const addresses=await Address.findOne({userId})
        let totalAmout=0
        const orderedItem=cart.item.map((item)=>{
          const itemTotal=item.quantity*item.productId.price 
          totalAmout+=itemTotal
          return{
            productId:item.productId._id,
            quantity:item.quantity,
            size:item.size,
            productPrice:item.productId.price,
            productStatus:"Pending",
            totalProductPrice:itemTotal
          }
        })
        const shippingDate = new Date();
        shippingDate.setDate(shippingDate.getDate() + 5);

        const orderNumber="ORD"+Math.floor(Math.random()*1000000)
        const newOrder=new Orders({
            userId,
            cartId:cart._id,
            orderedItem:orderedItem,
            deliveryAddress:addressId,
            orderAmount:totalAmout,
            deliveryDate:new Date(),
            shippingDate,
            paymentMethod:"Cash On Delivery",
            paymentStatus:"Pending",
            orderNumber
        })
        await newOrder.save()
        await Cart.deleteMany({userId})


        for(let i=0;i<orderedItem.length;i++){
            const item=orderedItem[i]
            await Product.updateOne(
                { _id: item.productId, "stock.size": item.size },
                {
                    $inc: {
                        "stock.$.quantity": -item.quantity,
                        totalstock: -item.quantity,
                    },
                }
            );
        }

        res.json({ success: true, orderId: newOrder._id });
    
     
    } catch (error) {
        console.log(error);
    }
}

const loadPlaceOrder=async (req,res) => {
    try {
        const orderId=req.query.id
        console.log("orderid",orderId);
       const order=await Orders.findOne({_id:orderId})
       console.log("order",order);
       const user=await User.findOne({_id:req.session.userId})
       const cart=await Cart.findOne({userId:req.session.userId}).populate("item.productId", "name image");
        return res.render('placeorder',{order,user,cart,})
    } catch (error) {
        console.log(error);
    }
}

const loadOrderDetails=async (req,res) => {
    try {
        const orderId=req.params.orderId
        const order=await Orders.findOne({_id:orderId}).populate('orderedItem.productId')
        const deliveryAddress=order.deliveryAddress
        const addressData=await Address.findOne({"address._id":deliveryAddress},{ "address.$": 1 })
        let address=[]
        if (addressData && addressData.address.length > 0) {
            address = addressData.address;
        }
        console.log("address",address);
        res.render('orderdetails',{order,address})
    } catch (error) {
        console.log(error);
    }
}



module.exports={
    loadCheckout,
    loadPlaceOrder,
    placeOrder,
    loadOrderDetails

}