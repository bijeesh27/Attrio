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
    console.log("entering update return controller");
    
    const order=await Orders.findOne({_id:orderId})
    const userId=order.userId
    const ReturnedProduct=order.orderedItem.find(item=>item._id.toString()===itemId)
    const productId=ReturnedProduct.productId
    const product=await Product.findOne({_id:productId})
    const stock=product.stock.find(item=>item.size===ReturnedProduct.size)
    console.log("stock",stock);
    
    ReturnedProduct.productStatus=status
    if(ReturnedProduct.productStatus==="Return Approved"){
      ReturnedProduct.returnStatus="Approved";
      ReturnedProduct.returnApproved=true
      stock.quantity=stock.quantity+ReturnedProduct.quantity
      



      const userWallet = await Wallet.findOne({ userId });
  
      // If wallet exists, update it
      if (userWallet) {
        userWallet.balance += (ReturnedProduct.productPrice * ReturnedProduct.quantity);
        userWallet.transaction.push({
          amount: ReturnedProduct.productPrice* ReturnedProduct.quantity,
          transactionsMethod: "Refund",
          orderId: ReturnedProduct.orderId
        });
        await userWallet.save();
      } else {
        // Create a new wallet if it doesn't exist
        const newWallet = new Wallet({
          userId: ReturnedProduct.userId,
          balance: ReturnedProduct.productPrice * ReturnedProduct.quantity,
          transaction: [{
            amount: ReturnedProduct.productPrice* ReturnedProduct.quantity,
            transactionsMethod: "Refund",
            orderId: ReturnedProduct.orderId
          }]
        });
        await newWallet.save();
      }


    }else{
      ReturnedProduct.returnStatus="Rejected";
      ReturnedProduct.returnApproved=false
    }
    await order.save()
    await product.save()
    return res.status(200).json({
      success: true,
      message: `Return request ${status.toLowerCase()} successfully`,
    });
  } catch (error) {
    console.log(error);
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
