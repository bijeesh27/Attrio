const Orders = require("../../models/orderSchema");
const Product = require("../../models/productSchema");
const Wallet=require('../../models/walletSchema')

const loadOrders = async (req, res) => {
  try {
    const searchQuery = req.query.query || "";
    const page = parseInt(req.query.page) || 1;
    const limit = 5;

    // Update search filter to match fields in your order schema
    const searchFilter = searchQuery
      ? {
          $or: [
            { orderNumber: { $regex: searchQuery, $options: "i" } },
            { paymentMethod: { $regex: searchQuery, $options: "i" } },
          ],
        }
      : {};

    const skip = (page - 1) * limit;

    const totalOrders = await Orders.countDocuments(searchFilter);
    const totalPages = Math.ceil(totalOrders / limit);

    
    const orders = await Orders.find(searchFilter)
      .populate("userId", "username email")
      .populate("orderedItem.productId")
      .populate("deliveryAddress")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });


      console.log("orders",orders);


    res.render("admin-orders", {
      searchQuery,
      orders,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalOrders,
      },
      pages: Array.from({ length: totalPages }, (_, i) => i + 1),
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("An error occurred");
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { orderId, statusType, newStatus } = req.body;
    console.log(req.body);

    const order = await Orders.findById(orderId);

    if (statusType === "orderStatus") {
      const validStatuses = ["pending", "shipped", "delivered", "cancelled"];

      order.orderStatus =
        newStatus.charAt(0).toUpperCase() + newStatus.slice(1).toLowerCase();

      if (newStatus.toLowerCase() === "shipped" && !order.shippingDate) {
        order.shippingDate = new Date();
      }

      if (newStatus.toLowerCase() === "delivered" && !order.deliveryDate) {
        order.deliveryDate = new Date();
      }
    } else if (statusType === "paymentStatus") {
      const validPaymentStatuses = ["paid", "pending", "failed"];

      order.paymentStatus =
        newStatus.charAt(0).toUpperCase() + newStatus.slice(1).toLowerCase();
    } else if (statusType === "returnStatus") {
      const validReturnStatuses = [
        "none",
        "requested",
        "approved",
        "completed",
        "rejected",
      ];

      if (newStatus.toLowerCase() === "none") {
        order.returnStatus = undefined;
      } else {
        order.returnStatus =
          newStatus.charAt(0).toUpperCase() + newStatus.slice(1).toLowerCase();
      }
    }

    await order.save();

    res.json({
      success: true,
      message: `Order ${statusType} updated successfully`,
      newStatus: newStatus,
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update order status",
    });
  }
};

const updateProductStatus = async (req, res) => {
  try {
    const { orderId, itemId, newStatus } = req.body;

    const order = await Orders.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Find the specific item in the order
    const orderItem = order.orderedItem.id(itemId);
    if (!orderItem) {
      return res.status(404).json({
        success: false,
        message: "Order item not found",
      });
    }

    // Update the product status
    orderItem.productStatus =
      newStatus.charAt(0).toUpperCase() + newStatus.slice(1).toLowerCase();

    await order.save();

    res.json({
      success: true,
      message: "Product status updated successfully",
    });
  } catch (error) {
    console.error("Error updating product status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update product status",
    });
  }
};

const updateReturn = async (req, res) => {
  try {
    const { orderId, itemId, status } = req.body;
    console.log("Entering update return controller");

    // Fetch the order
    const order = await Orders.findOne({ _id: orderId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const userId = order.userId;
    const returnedItem = order.orderedItem.find(item => item._id.toString() === itemId);
    if (!returnedItem) {
      return res.status(400).json({ success: false, message: 'Item not found in order' });
    }

    const productId = returnedItem.productId;
    const product = await Product.findOne({ _id: productId });
    const stock = product.stock.find(item => item.size === returnedItem.size);
    console.log("Stock:", stock);

    // Update return status
    returnedItem.productStatus = status;

    if (status === 'Return Approved') {
      returnedItem.returnStatus = 'Approved';
      returnedItem.returnApproved = true;
      returnedItem.returnApprovedDate = new Date();

      // Increment stock
      stock.quantity += returnedItem.quantity;

      // Calculate refund amount considering offers and coupons
      let refundAmount = returnedItem.totalProductPrice; // Base refund on totalProductPrice (includes offer discount)

      // Adjust for coupon discount if applied to the order
      if (order.couponDiscount && order.couponDiscount > 0) {
        const totalOrderBeforeCoupon = order.orderedItem.reduce(
          (sum, item) => sum + item.totalProductPrice,
          0
        );
        const couponShare = (returnedItem.totalProductPrice / totalOrderBeforeCoupon) * order.couponDiscount;
        refundAmount = Math.max(0, refundAmount - couponShare); // Ensure refund isn't negative
      }

      // Update wallet
      let userWallet = await Wallet.findOne({ userId });
      if (userWallet) {
        userWallet.balance += refundAmount;
        userWallet.transaction.push({
          amount: refundAmount,
          transactionsMethod: 'Refund',
          date: new Date(),
          orderId: order._id // Use the order ID, not item.orderId
        });
        await userWallet.save();
      } else {
        // Create a new wallet if it doesn't exist
        const newWallet = new Wallet({
          userId,
          balance: refundAmount,
          transaction: [{
            amount: refundAmount,
            transactionsMethod: 'Refund',
            date: new Date(),
            orderId: order._id
          }]
        });
        await newWallet.save();
      }

      // Update order status if all items are returned
      const allReturned = order.orderedItem.every(item => item.productStatus === 'Returned');
      if (allReturned) {
        order.orderStatus = 'Returned';
      }
    } else if (status === 'Return Rejected') {
      returnedItem.returnStatus = 'Rejected';
      returnedItem.returnApproved = false;
    } else {
      return res.status(400).json({ success: false, message: 'Invalid status provided' });
    }

    // Save changes
    await order.save();
    await product.save();

    return res.status(200).json({
      success: true,
      message: `Return request ${status.toLowerCase()} successfully`,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const loadOrderdetails = async (req, res) => {
  try {
    const orderId = req.params.orderId;

    const order = await Orders.findOne({ _id: orderId })
      .populate("userId", "username email number timestamp createdAt")
      .populate("orderedItem.productId")
      .populate("deliveryAddress");

    res.render("admin-order-details", { order });
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  loadOrders,
  updateOrderStatus,
  loadOrderdetails,
  updateProductStatus,
  updateReturn,
};
