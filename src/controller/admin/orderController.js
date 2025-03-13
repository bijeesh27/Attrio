const Orders = require("../../models/orderSchema");

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

    // Update populate paths based on your schema
    const orders = await Orders.find(searchFilter)
      .populate("userId", "username email") // Correct field from schema
      .populate("orderedItem.productId") // Correct path for products
      .populate("deliveryAddress")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

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


const loadOrderdetails=async (req,res) => {
    try {
        const orderId=req.params.orderId
        
    
        
        const order = await Orders.findOne({_id:orderId})
          .populate("userId", "username email number timestamp createdAt") 
          .populate("orderedItem.productId") 
          .populate("deliveryAddress")
          
    
        res.render("admin-order-details", {order});
    } catch (error) {
        console.log(error);
        
    }    
}

module.exports = {
  loadOrders,
  updateOrderStatus,
  loadOrderdetails
};
