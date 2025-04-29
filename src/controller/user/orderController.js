const User = require("../../models/userSchema");
const Cart = require("../../models/cartSchema");
const Address = require("../../models/addressSchema");
const Orders = require("../../models/orderSchema");
const Product = require("../../models/productSchema");
const Coupon = require("../../models/couponSchema");
const Wallet = require("../../models/walletSchema");
const razorpay = require("../../config/rozorpay");
const Razorpay = require("razorpay");
const mongoose = require("mongoose");

const loadCheckout = async (req, res) => {
  try {
    const userId = req.session.userId;
    const cart = await Cart.findOne({ userId }).populate("item.productId");
    const addressDoc = await Address.findOne({ userId });
    const addresses = addressDoc ? addressDoc.address : [];

    const wallet = await Wallet.findOne({ userId });
    const walletBalance = wallet ? wallet.balance : 0;
    console.log("wallect Balance", walletBalance);

    const coupons = await Coupon.find({
      status: true,
      expiry: { $gte: new Date() },
      maxRedeem: { $gt: 0 },
    });

    let appliedCoupon = null;
    if (req.session.appliedCoupon) {
      appliedCoupon = req.session.appliedCoupon;
    }

    res.render("checkout", {
      cart,
      addresses,
      coupons,
      appliedCoupon,
      walletBalance,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};

const walletBalance = async (req, res) => {
  try {
    const userId = req.session.userId;
    const wallet = await Wallet.findOne({ userId });
    console.log("wallet", wallet);
    res.json({ balance: wallet.balance });
  } catch (error) {
    res.status(500).json({ error: "Could not retrieve wallet balance" });
  }
};

const applyCoupon = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { couponCode, cartTotal } = req.body;

    const user = await User.findById(userId);
    if (
      user.usedCoupons &&
      user.usedCoupons.includes(couponCode.toUpperCase())
    ) {
      return res.json({
        success: false,
        message: "You have already used this coupon",
      });
    }

    const coupon = await Coupon.findOne({
      couponCode: couponCode.toUpperCase(),
      status: true,
      expiry: { $gte: new Date() },
      maxRedeem: { $gt: 0 },
    });

    if (!coupon) {
      return res.json({ success: false, message: "Invalid or expired coupon" });
    }

    if (cartTotal < coupon.minPurchase) {
      return res.json({
        success: false,
        message: `Minimum purchase of Rs.${coupon.minPurchase} required`,
      });
    }

    let discountAmount = 0;
    if (coupon.type === "percentageDiscount") {
      discountAmount = (coupon.discount / 100) * cartTotal;
    } else {
      discountAmount = coupon.discount;
    }

    req.session.appliedCoupon = {
      couponCode: coupon.couponCode,
      discountAmount,
    };

    res.json({
      success: true,
      couponCode: coupon.couponCode,
      discountAmount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error applying coupon" });
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
    res.status(500).json({ success: false, message: "Error removing coupon" });
  }
};

const placeOrder = async (req, res) => {
  try {
    const { addressId, paymentMethod, paymentId, razorpayOrderId } = req.body;
    const userId = req.session.userId;

    const cart = await Cart.findOne({ userId }).populate("item.productId");
    if (!cart || !cart.item.length) {
      return res.status(400).json({ success: false, error: "Cart is empty" });
    }

    // Stock validation before order processing
    const stockValidationErrors = [];
    for (const item of cart.item) {
      const product = await Product.findById(item.productId._id);
      
      // Check if product exists
      if (!product) {
        stockValidationErrors.push(`Product "${item.productId.name}" is no longer available`);
        continue;
      }
      
      // Find the specific size in product stock
      const sizeStock = product.stock.find(stock => stock.size === item.size);
      
      // Check if size exists and has sufficient quantity
      if (!sizeStock) {
        stockValidationErrors.push(`Size ${item.size} for "${product.name}" is not available`);
      } else if (sizeStock.quantity < item.quantity) {
        stockValidationErrors.push(
          `Insufficient stock for "${product.name}" in size ${item.size}. ` +
          `Available: ${sizeStock.quantity}, Requested: ${item.quantity}`
        );
      }
    }
    
    // Return errors if stock validation fails
    if (stockValidationErrors.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: "Stock validation failed", 
        details: stockValidationErrors 
      });
    }

    let subtotalBeforeDiscounts = 0;
    let subtotalAfterOffers = 0;

    const orderedItem = cart.item.map((item) => {
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
        productStatus: "Pending",
        offer_id: item.offer_id || null,
      };
    });

    let discount = 0;
    let usedCoupon = null;
    let totalAmount = subtotalAfterOffers;

    if (req.session.appliedCoupon) {
      discount = req.session.appliedCoupon.discountAmount;
      usedCoupon = req.session.appliedCoupon.couponCode;
      totalAmount = Math.max(0, totalAmount - discount);
    }

    const shippingDate = new Date();
    shippingDate.setDate(shippingDate.getDate() + 5);

    const orderNumber = "ORD" + Math.floor(Math.random() * 1000000);

    let paymentStatus;
    if (paymentMethod === "Cash On Delivery") {
      paymentStatus = "Pending";
    } else if (paymentMethod === "razorpay") {
      if (razorpayOrderId && paymentId) {
        paymentStatus = "Paid";
      } else if (paymentId && !razorpayOrderId) {
        paymentStatus = "Failed";
      } else {
        paymentStatus = "Pending";
      }
    } else {
      paymentStatus = "Paid";
    }

    if (paymentMethod === "Wallet") {
      const wallet = await Wallet.findOne({ userId });

      if (!wallet) {
        return res.status(400).json({
          success: false,
          error: "No wallet found for this user",
        });
      }

      if (wallet.balance < totalAmount) {
        return res.status(400).json({
          success: false,
          error: `Insufficient wallet balance. Available: ₹${wallet.balance.toFixed(
            2
          )}, Required: ₹${totalAmount.toFixed(2)}`,
        });
      }

      wallet.balance -= totalAmount;
      wallet.transaction.push({
        amount: totalAmount,
        transactionsMethod: "Payment",
        date: new Date(),
        orderId: null,
      });

      await wallet.save();
      paymentStatus = "Paid";
    }

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
      couponCode: usedCoupon,
    });

    await newOrder.save();

    if (paymentMethod === "Wallet") {
      const wallet = await Wallet.findOne({ userId });
      const lastTransaction = wallet.transaction[wallet.transaction.length - 1];
      lastTransaction.orderId = newOrder._id;
      await wallet.save();
    }

    await Cart.deleteMany({ userId });
    req.session.cartItem = 0;

    delete req.session.appliedCoupon;

    // Update product stock after successful order
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
    console.error(error);
    res.status(500).json({ success: false, error: "Order processing failed" });
  }
};


const loadPlaceOrder = async (req, res) => {
  try {
    const orderId = req.query.id;
    console.log("orderid", orderId);
    const order = await Orders.findOne({ _id: orderId });
    console.log("order", order);
    const user = await User.findOne({ _id: req.session.userId });
    const cart = await Cart.findOne({ userId: req.session.userId }).populate(
      "item.productId",
      "name image"
    );
    return res.render("placeorder", { order, user, cart });
  } catch (error) {
    console.log(error);
  }
};

const loadOrderDetails = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const order = await Orders.findOne({ _id: orderId }).populate(
      "orderedItem.productId"
    );
    const deliveryAddress = order.deliveryAddress;
    const addressData = await Address.findOne(
      { "address._id": deliveryAddress },
      { "address.$": 1 }
    );
    let address = [];
    if (addressData && addressData.address.length > 0) {
      address = addressData.address;
    }
    console.log("address", address);
    res.render("orderdetails", { order, address });
  } catch (error) {
    console.log(error);
  }
};

const cancelOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const order = await Orders.findOne({ _id: orderId });

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    const userId = order.userId;
    let totalRefundAmount = 0;

    for (const item of order.orderedItem) {
      const product = await Product.findOne({ _id: item.productId });

      if (product) {
        const sizeIndex = product.stock.findIndex(
          (stockItem) => stockItem.size === item.size
        );

        if (sizeIndex !== -1) {
          product.stock[sizeIndex].quantity += item.quantity;
          product.totalstock += item.quantity;
          await product.save();
        }
      }

      totalRefundAmount += item.totalProductPrice;
    }

    if (order.couponDiscount && order.couponDiscount > 0) {
      totalRefundAmount -= order.couponDiscount;

      totalRefundAmount = Math.max(0, totalRefundAmount);
    }

    if (order.paymentStatus === "Paid") {
      let userWallet = await Wallet.findOne({ userId });

      if (userWallet) {
        userWallet.balance += totalRefundAmount;
        userWallet.transaction.push({
          amount: totalRefundAmount,
          transactionsMethod: "Refund",
          date: new Date(),
          orderId: order._id,
        });
        await userWallet.save();
      } else {
        const newWallet = new Wallet({
          userId,
          balance: totalRefundAmount,
          transaction: [
            {
              amount: totalRefundAmount,
              transactionsMethod: "Refund",
              date: new Date(),
              orderId: order._id,
            },
          ],
        });
        await newWallet.save();
      }

      await Orders.updateOne(
        { _id: orderId },
        {
          $set: {
            orderStatus: "Cancelled",
            paymentStatus: "Refunded",
            "orderedItem.$[].productStatus": "Cancelled",
            cancelledDate: new Date(),
          },
        }
      );
    } else if (order.paymentMethod === "Cash On Delivery") {
      await Orders.updateOne(
        { _id: orderId },
        {
          $set: {
            orderStatus: "Cancelled",
            paymentStatus: "Cancelled",
            "orderedItem.$[].productStatus": "Cancelled",
            cancelledDate: new Date(),
          },
        }
      );
    }

    res.redirect("/orders");
  } catch (error) {
    console.error("Error cancelling order:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const returnOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const productId = req.params.productId;
    const { returnReason, itemIndex } = req.body;
    const order = await Orders.findOne({ _id: orderId });

    order.orderedItem[itemIndex].productStatus = "Return Requested";
    order.orderedItem[itemIndex].returnStatus = "Requested";
    order.orderedItem[itemIndex].returnReason = returnReason;
    await order.save();

    res.redirect(`/orderdetails/${orderId}`);
  } catch (error) {
    console.log(error);
  }
};

const loadInvoice = async (req, res) => {
  try {
    const company = {
      name: "Attiro",
      phone: 9876543210,
      email: "attirofashions@gmail.com",
      address: "Hsr Layout",
    };

    const orderId = req.params.orderId;

    const order = await Orders.findOne({ _id: orderId })
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

    res.render("invoice", { order, company, address });
  } catch (error) {
    console.log(error);
    res.status(500).send("Error generating invoice");
  }
};

const createOrder = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || isNaN(amount)) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    let amountInPaise = Math.round(Number(amount));

    if (amountInPaise > 50000000) {
      return res
        .status(400)
        .json({ error: "Amount exceeds maximum limit of ₹5,00,000" });
    }

    const receipt = `order_rcpt_${Date.now()}_${Math.floor(
      Math.random() * 1000
    )}`;

    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: receipt,
    };

    const order = await razorpay.orders.create(options);

    return res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: process.env.TEST_KEY_ID,
    });
  } catch (error) {
    console.error("Razorpay order creation error:", error);
    return res.status(500).json({ error: "Failed to create payment order" });
  }
};

const retryPayment = async (req, res) => {
  try {
    const { orderId, amount } = req.body;

    const order = await Orders.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const instance = new Razorpay({
      key_id: process.env.TEST_KEY_ID,
      key_secret: process.env.TEST_KEY_SECRET,
    });

    const options = {
      amount: amount,
      currency: "INR",
      receipt: "receipt_" + orderId,
    };

    instance.orders.create(options, (err, razorpayOrder) => {
      if (err) {
        console.error("Razorpay Error:", err);
        return res
          .status(500)
          .json({ error: "Failed to create payment order" });
      }

      return res.json({
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key_id: process.env.TEST_KEY_ID,
      });
    });
  } catch (error) {
    console.error("Error in retry-payment:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const updatePayment = async (req, res) => {
  try {
    const { orderId, paymentId, razorpayOrderId } = req.body;

    const order = await Orders.findById(orderId);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    order.paymentStatus = "paid";
    order.paymentId = paymentId;
    order.razorpayOrderId = razorpayOrderId;
    order.paymentDate = new Date();

    await order.save();

    res.json({ success: true, message: "Payment status updated successfully" });
  } catch (error) {
    console.error("Error in update-payment-status:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const loadOrderFailure = async (req, res) => {
  try {
    const orderId = req.query.id;
    const order = await Orders.findOne({ _id: orderId }).populate(
      "userId",
      "email"
    );

    if (!order) {
      return res.status(404).send("Order not found");
    }

    res.render("orderFailure", { order });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};

const cancelItem = async (req, res) => {
  try {
    const { orderId, productId } = req.params;
    const userId = req.session.userId;
    const order = await Orders.findOne({ _id: orderId });
    if (!order) {
      return res.redirect(`/orderdetails/${orderId}?error=Order+not+found`);
    }
    if (order.userId.toString() !== userId) {
      return res.redirect(`/orderdetails/${orderId}?error=Unauthorized+access`);
    }
    const itemIndex = order.orderedItem.findIndex(
      (item) => item.productId.toString() === productId
    );
    if (itemIndex === -1) {
      return res.redirect(`/orderdetails/${orderId}?error=Item+not+found`);
    }

    const item = order.orderedItem[itemIndex];

    if (
      item.productStatus.toLowerCase() === "delivered" ||
      item.productStatus.toLowerCase() === "cancelled"
    ) {
      return res.redirect(
        `/orderdetails/${orderId}?error=Item+cannot+be+cancelled`
      );
    }

    let refundAmount = 0;
    const totalItemsPrice = order.orderedItem.reduce((sum, orderItem) => 
      sum + orderItem.productPrice * orderItem.quantity, 0);
    
    const totalDiscount = order.couponDiscount || 0;
    const itemOriginalPrice = item.productPrice * item.quantity;
    const itemProportion = itemOriginalPrice / totalItemsPrice;

    const itemDiscountShare = totalDiscount * itemProportion;
 
    refundAmount = item.totalProductPrice - itemDiscountShare;

    refundAmount = Math.max(0, refundAmount);

    const product = await Product.findOne({ _id: item.productId });
    if (product) {
      const sizeIndex = product.stock.findIndex(
        (stockItem) => stockItem.size === item.size
      );
      if (sizeIndex !== -1) {
        product.stock[sizeIndex].quantity += item.quantity;
        product.totalstock += item.quantity;
        await product.save();
      }
    }
    order.orderedItem[itemIndex].productStatus = "Cancelled";
    order.orderAmount -= item.totalProductPrice;
    if (order.orderAmount < 0) order.orderAmount = 0;

    const allCancelled = order.orderedItem.every(
      (item) => item.productStatus.toLowerCase() === "cancelled"
    );
    
    if (allCancelled) {
      order.orderStatus = "Cancelled";
      order.paymentStatus = order.paymentStatus === "Paid" ? "Refunded" : "Cancelled";
    }
    await order.save();

    if ((order.paymentStatus === "Paid" || order.paymentStatus === "Refunded") && refundAmount > 0) {
      let userWallet = await Wallet.findOne({ userId });
      
      if (userWallet) {
        userWallet.balance += refundAmount;
        userWallet.transaction.push({
          amount: refundAmount,
          transactionsMethod: "Refund",
          date: new Date(),
          orderId: order._id,
        });
        await userWallet.save();
      } else {
        const newWallet = new Wallet({
          userId,
          balance: refundAmount,
          transaction: [
            {
              amount: refundAmount,
              transactionsMethod: "Refund",
              date: new Date(),
              orderId: order._id,
            },
          ],
        });
        await newWallet.save();
      }
    }

    return res.redirect(`/orderdetails/${orderId}?success=Item+cancelled+successfully`);
  } catch (error) {
    console.error("Error cancelling item:", error);
    return res.redirect(
      `/orderdetails/${req.params.orderId || ''}?error=Error+cancelling+item,+please+try+again`
    );
  }
};

module.exports = {
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
  walletBalance,
  updatePayment,
  retryPayment,
  loadOrderFailure,
  cancelItem
};
