const User=require('../../models/userSchema')
const Cart=require("../../models/cartSchema")
const Address = require('../../models/addressSchema')
const Orders = require('../../models/orderSchema')
const Product = require('../../models/productSchema')
const razorpay = require('../../config/rozorpay');


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

const placeOrder = async (req, res) => {
    try {
      const { addressId, paymentMethod, paymentId, razorpayOrderId } = req.body;
      console.log("addressId", addressId);
      const userId = req.session.userId;
      const cart = await Cart.findOne({ userId }).populate("item.productId");
      
      let totalAmount = 0;
      const orderedItem = cart.item.map((item) => {
        const itemTotal = item.quantity * item.productId.price;
        totalAmount += itemTotal;
        return {
          productId: item.productId._id,
          quantity: item.quantity,
          size: item.size,
          productPrice: item.productId.price,
          productStatus: "Pending",
          totalProductPrice: itemTotal
        };
      });
      
      const shippingDate = new Date();
      shippingDate.setDate(shippingDate.getDate() + 5);
  
      const orderNumber = "ORD" + Math.floor(Math.random() * 1000000);
      
      // Determine payment status based on payment method
      const paymentStatus = paymentMethod === 'Cash On Delivery' ? 'Pending' : 'Paid';
      
      const newOrder = new Orders({
        userId,
        cartId: cart._id,
        orderedItem: orderedItem,
        deliveryAddress: addressId,
        orderAmount: totalAmount,
        deliveryDate: new Date(),
        shippingDate,
        paymentMethod: paymentMethod,
        paymentStatus: paymentStatus,
        orderNumber,
        paymentId: paymentId || null,
        razorpayOrderId: razorpayOrderId || null
      });
      
      await newOrder.save();
      await Cart.deleteMany({ userId });
  
      // Update product stock
      for (let i = 0; i < orderedItem.length; i++) {
        const item = orderedItem[i];
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
      res.status(500).json({ success: false, error: 'Order processing failed' });
    }
  };

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

const cancelOrder=async (req,res) => {
    try {
        const orderId=req.params.orderId
        await Orders.updateOne({_id:orderId},{$set:{orderStatus:"Cancelled",paymentStatus:"Failed"}})
        const order=await Orders.findOne({_id:orderId})
        for (const item of order.orderedItem) {
            const product = await Product.findOne({ _id: item.productId });
            
            if (product) {
                
                const sizeIndex = product.stock.findIndex(
                    stockItem => stockItem.size === item.size
                );
                
                if (sizeIndex !== -1) {
                   
                    product.stock[sizeIndex].quantity += item.quantity;
                    
                   
                    product.totalstock += item.quantity;
                    
                   
                    await product.save();
                }
            }
        }
        await Orders.updateOne(
            { _id: orderId },
            { 
                $set: { 
                    "orderedItem.$[].productStatus": "Cancelled"
                }
            }
        );
        res.redirect('/orders')
    } catch (error) {
        console.log(error);
    }
}

const returnOrder=async (req,res) => {
    try {
        const orderId=req.params.orderId
        const productId=req.params.productId
        const { returnReason, itemIndex } = req.body;
        const order=await Orders.findOne({_id:orderId})

        order.orderedItem[itemIndex].productStatus="Return Requested"
        order.orderedItem[itemIndex].returnStatus="Requested"
        order.orderedItem[itemIndex].returnReason=returnReason
        await order.save()
        res.redirect(`/orderdetails/${orderId}`)
    } catch (error) {
        console.log(error);
    }
}




const loadInvoice = async (req, res) => {
    try {
        const company = {
            name: "Attiro", 
            phone: 9876543210, 
            email: "attirofashions@gmail.com", 
            address: 'Hsr Layout'
        };
        
        const orderId = req.params.orderId;
        
       
        const order = await Orders.findOne({_id: orderId})
            .populate("userId", "username email number timestamp createdAt")
            .populate("orderedItem.productId");
            
        
        const addressData = await Address.findOne(
            { userId: order.userId._id, "address._id": order.deliveryAddress },
            { "address.$": 1 }
        );
        
        let address = [];
        if (addressData && addressData.address && addressData.address.length > 0) {
            address = addressData.address;
        }
        
        res.render('invoice', { order, company, address });
    } catch (error) {
        console.log(error);
        res.status(500).send("Error generating invoice");
    }
}

// Create Razorpay order
const createOrder = async (req, res) => {
    try {
      const { amount, addressId } = req.body;
      const userId = req.session.userId;
      
      // Create unique receipt ID
      const receipt = 'order_rcpt_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
      
      const options = {
        amount: amount, // amount in smallest currency unit (paise)
        currency: 'INR',
        receipt: receipt
      };
      
      // Create order in Razorpay
      const order = await razorpay.orders.create(options);
      
      // Return the order details
      return res.json({
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        key_id: process.env.TEST_KEY_ID
      });
    } catch (error) {
      console.error('Razorpay order creation error:', error);
      return res.status(500).json({ error: 'Failed to create payment order' });
    }
  };


module.exports={
    loadCheckout,
    loadPlaceOrder,
    placeOrder,
    loadOrderDetails,
    cancelOrder,
    loadInvoice,
    returnOrder,
    createOrder

}