const User=require('../../models/userSchema')
const Cart=require("../../models/cartSchema")
const Address = require('../../models/addressSchema')
const Orders = require('../../models/orderSchema')
const Product = require('../../models/productSchema')
const Coupon=require('../../models/couponSchema')
const Wallet=require('../../models/walletSchema')
const razorpay = require('../../config/rozorpay');


const loadCheckout = async (req, res) => {
  try {
   const userId = req.session.userId;
   const cart = await Cart.findOne({ userId }).populate('item.productId');
   const addressDoc = await Address.findOne({ userId });
   const addresses = addressDoc ? addressDoc.address : [];
   
   // Get user's wallet
   const wallet = await Wallet.findOne({ userId });
   const walletBalance = wallet ? wallet.balance : 0;
   console.log("wallect Balance",walletBalance);

   const coupons = await Coupon.find({
     status: true,
     expiry: { $gte: new Date() },
     maxRedeem: { $gt: 0 }
   });

   // Check if a coupon is already applied (stored in session)
   let appliedCoupon = null;
   if (req.session.appliedCoupon) {
     appliedCoupon = req.session.appliedCoupon;
   }

   res.render('checkout', {
     cart,
     addresses,
     coupons,
     appliedCoupon,
     walletBalance
   });
 } catch (error) {
   console.error(error);
   res.status(500).send('Server Error');
 }
}

const walletBalance=async (req,res) => {
  try {
    const userId=req.session.userId
    const wallet=await Wallet.findOne({userId})
    console.log("wallet",wallet);
    res.json({ balance: wallet.balance });
  } catch (error) {
    res.status(500).json({ error: 'Could not retrieve wallet balance' });
  }
}


const applyCoupon = async (req, res) => {
    try {
      const userId = req.session.userId;
      const { couponCode, cartTotal } = req.body;
      
      // Check if user has already used this coupon before
      const user = await User.findById(userId);
      if (user.usedCoupons && user.usedCoupons.includes(couponCode.toUpperCase())) {
        return res.json({ 
          success: false, 
          message: 'You have already used this coupon' 
        });
      }
      
      const coupon = await Coupon.findOne({
        couponCode: couponCode.toUpperCase(),
        status: true,
        expiry: { $gte: new Date() },
        maxRedeem: { $gt: 0 }
      });
  
      if (!coupon) {
        return res.json({ success: false, message: 'Invalid or expired coupon' });
      }
  
      if (cartTotal < coupon.minPurchase) {
        return res.json({
          success: false,
          message: `Minimum purchase of Rs.${coupon.minPurchase} required`
        });
      }
  
      let discountAmount = 0;
      if (coupon.type === 'percentageDiscount') {
        discountAmount = (coupon.discount / 100) * cartTotal;
      } else {
        discountAmount = coupon.discount;
      }
  
      // Store applied coupon in session
      req.session.appliedCoupon = {
        couponCode: coupon.couponCode,
        discountAmount
      };
  
      res.json({
        success: true,
        couponCode: coupon.couponCode,
        discountAmount
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Error applying coupon' });
    }
  };
  
  const removeCoupon = async (req, res) => {
    try {
      const userId = req.session.userId;
      
      
      if (req.session.appliedCoupon) {
        delete req.session.appliedCoupon;
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Error removing coupon' });
    }
  };

  const placeOrder = async (req, res) => {
    try {
      const { addressId, paymentMethod, paymentId, razorpayOrderId } = req.body;
      const userId = req.session.userId;
  
      // Fetch cart with populated product details
      const cart = await Cart.findOne({ userId }).populate('item.productId');
      if (!cart || !cart.item.length) {
        return res.status(400).json({ success: false, error: 'Cart is empty' });
      }
  
      let subtotalBeforeDiscounts = 0; 
      let subtotalAfterOffers = 0; 
      // Map cart items to ordered items, applying offer prices
      const orderedItem = cart.item.map(item => {
        const originalPrice = item.price; 
        let offerPrice = item.offerPrice || originalPrice;
        const itemOriginalTotal = originalPrice * item.quantity;
        const itemDiscountedTotal = offerPrice * item.quantity;
  
        subtotalBeforeDiscounts += itemOriginalTotal;
        subtotalAfterOffers += itemDiscountedTotal;
  
        return {
          productId: item.productId._id,
          quantity: item.quantity,
          size: item.size,
          productPrice: originalPrice,        
          totalProductPrice: itemDiscountedTotal, 
          productStatus: 'Pending',
          offer_id: item.offer_id || null 
        };
      });
  
      // Apply coupon discount if any
      let discount = 0;
      let usedCoupon = null;
      let totalAmount = subtotalAfterOffers;
  
      if (req.session.appliedCoupon) {
        discount = req.session.appliedCoupon.discountAmount;
        usedCoupon = req.session.appliedCoupon.couponCode;
  
        // Adjust the total amount with coupon discount
        totalAmount = Math.max(0, totalAmount - discount); 
      }
  
      // Set shipping date (5 days from now)
      const shippingDate = new Date();
      shippingDate.setDate(shippingDate.getDate() + 5);
  
      // Generate order number
      const orderNumber = 'ORD' + Math.floor(Math.random() * 1000000);
  
      // Determine payment status and handle wallet payment
      let paymentStatus = paymentMethod === 'Cash On Delivery' ? 'Pending' : 'Paid';
      
      if (paymentMethod === 'Wallet') {
        const wallet = await Wallet.findOne({ userId });
        
        // Check if wallet exists and has sufficient balance
        if (!wallet) {
          return res.status(400).json({ 
            success: false, 
            error: 'No wallet found for this user' 
          });
        }
        
        if (wallet.balance < totalAmount) {
          return res.status(400).json({ 
            success: false, 
            error: `Insufficient wallet balance. Available: ₹${wallet.balance.toFixed(2)}, Required: ₹${totalAmount.toFixed(2)}` 
          });
        }
        
        // Deduct from wallet
        wallet.balance -= totalAmount;
        wallet.transaction.push({
          amount: totalAmount,
          transactionsMethod: 'Payment',
          date: new Date(),
          orderId: null
        });
        
        await wallet.save();
        
        paymentStatus = 'Paid';
      }
  
      // Create new order
      const newOrder = new Orders({
        userId,
        cartId: cart._id,
        orderedItem,
        deliveryAddress: addressId,
        orderAmount: totalAmount, 
        deliveryDate: new Date(),
        shippingDate,
        paymentMethod,
        paymentStatus,
        orderNumber,
        paymentId: paymentId || null,
        razorpayOrderId: razorpayOrderId || null,
        couponDiscount: discount,
        couponCode: usedCoupon
      });
  
      await newOrder.save();
  
      // If wallet payment, update the transaction with the new order ID
      if (paymentMethod === 'Wallet') {
        const wallet = await Wallet.findOne({ userId });
        const lastTransaction = wallet.transaction[wallet.transaction.length - 1];
        lastTransaction.orderId = newOrder._id;
        await wallet.save();
      }
  
      // Clear the cart
      await Cart.deleteMany({ userId });
      req.session.cartItem = 0;
  
      
      delete req.session.appliedCoupon;
  
      // Update product stock
      for (let i = 0; i < orderedItem.length; i++) {
        const item = orderedItem[i];
        await Product.updateOne(
          { _id: item.productId, 'stock.size': item.size },
          {
            $inc: {
              'stock.$.quantity': -item.quantity,
              totalstock: -item.quantity,
            },
          }
        );
      }
  
      res.json({ success: true, orderId: newOrder._id });
    } catch (error) {
      console.error(error);
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

const cancelOrder = async (req, res) => {
  try {
      const orderId = req.params.orderId;
      const order = await Orders.findOne({ _id: orderId });
      
      if (!order) {
          return res.status(404).json({ success: false, message: 'Order not found' });
      }
      
      const userId = order.userId;
      let totalRefundAmount = 0;
      
      // Calculate refund amount and update product stock
      for (const item of order.orderedItem) {
          const product = await Product.findOne({ _id: item.productId });
          
          if (product) {
              // Find and update the stock for the specific size
              const sizeIndex = product.stock.findIndex(
                  stockItem => stockItem.size === item.size
              );
              
              if (sizeIndex !== -1) {
                  
                  product.stock[sizeIndex].quantity += item.quantity;
                  product.totalstock += item.quantity;
                  await product.save();
              }
          }
          
          // Add item price to refund amount
          totalRefundAmount += item.totalProductPrice;
      }
      
      // Adjust for coupon if applicable
      if (order.couponDiscount && order.couponDiscount > 0) {
          totalRefundAmount -= order.couponDiscount;
          // Ensure refund isn't negative
          totalRefundAmount = Math.max(0, totalRefundAmount);
      }
      
      // Only process refund for paid orders
      if (order.paymentMethod !== 'COD' || order.paymentStatus === 'Paid') {
          // Update user wallet
          let userWallet = await Wallet.findOne({ userId });
          
          if (userWallet) {
              userWallet.balance += totalRefundAmount;
              userWallet.transaction.push({
                  amount: totalRefundAmount,
                  transactionsMethod: 'Refund',
                  date: new Date(),
                  orderId: order._id
              });
              await userWallet.save();
          } else {
              const newWallet = new Wallet({
                  userId,
                  balance: totalRefundAmount,
                  transaction: [{
                      amount: totalRefundAmount,
                      transactionsMethod: 'Refund',
                      date: new Date(),
                      orderId: order._id
                  }]
              });
              await newWallet.save();
          }
      }
      await Orders.updateOne(
          { _id: orderId },
          { 
              $set: { 
                  orderStatus: "Cancelled",
                  paymentStatus: "Failed",
                  "orderedItem.$[].productStatus": "Cancelled",
                  cancelledDate: new Date()
              }
          }
      );
      
      res.redirect('/orders');
  } catch (error) {
      console.error("Error cancelling order:", error);
      res.status(500).json({ success: false, message: 'Server error' });
  }
};

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
    const { amount } = req.body;

    if (!amount || isNaN(amount)) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    // Convert amount to an integer (round off decimals)
    let amountInPaise = Math.round(Number(amount));

    if (amountInPaise > 50000000) {
      return res.status(400).json({ error: "Amount exceeds maximum limit of ₹5,00,000" });
    }

    const receipt = `order_rcpt_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: receipt
    };

    // Create order in Razorpay
    const order = await razorpay.orders.create(options);

    return res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: process.env.TEST_KEY_ID
    });

  } catch (error) {
    console.error("Razorpay order creation error:", error);
    return res.status(500).json({ error: "Failed to create payment order" });
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
    createOrder,
    removeCoupon,
    applyCoupon,
    walletBalance

}