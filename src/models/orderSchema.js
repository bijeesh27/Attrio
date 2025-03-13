const mongoose = require("mongoose");
const { Schema } = mongoose;

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    cartId: {
      type: Schema.Types.ObjectId,
      ref: "Cart",
    },
    orderedItem: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "Product",
        },
        quantity: {
          type: Number,
          required: true,
        },
        size: {
          type: String,
          required: true,
        },
        productPrice: {
          type: Number,
          required: true,
        },
        productStatus: {
          type: String,
          enum: [
            "Pending",
            "Shipped",
            "Delivered",
            "Cancelled",
            "Returned",
            "Return Requested",
            "Return Approved",
            "Return Rejected",
          ],
          default: "Pending",
          required: true,
        },
        refunded: {
          type: Boolean,
          default: false,
        },
        totalProductPrice: {
          type: Number,
          required: true,
        },
        returnReason: {
          type: String,
        },
        returnStatus: {
          type: String,
          enum: ["Requested", "Approved", "Completed", "Rejected"],
        },
        returnRequestDate: Date,
        returnApproved: {
          type: Boolean,
          default: false,
        },
        returnApprovedDate: Date,
        returnNotes: String,
        offer_id: {
          type: mongoose.Schema.Types.ObjectId,
        },
      },
    ],
    deliveryAddress: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Address",
      required: true,
    },
    orderAmount: {
      type: Number,
      required: true,
    },
    deliveryDate: {
      ref: "Address",
      type: Date,
    },
    shippingDate: {
      type: Date,
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    paymentStatus: {
      type: String,
      required: true,
    },
    couponDiscount: {
      type: Number,
    },
    orderNumber: {
      type: String,
    },
    orderStatus: {
      type: String,
      enum: ["Pending", "Shipped", "Delivered", "Cancelled", "Returned"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

const Orders = mongoose.model("orders", orderSchema);
module.exports = Orders;
