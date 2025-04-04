const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      saprse: true,
      default: null,
    },
    number: {
      type: String,
      required: false,
      unique: false,
      saprse: true,
      default: null,
    },
    password: {
      type: String,
      required: false,
    },
    dob: {
      type: String,
      required: false,
    },
    profileimage: {
      type: Array,
      required: false,
    },
    status: {
      type: Boolean,
      default: true,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    usedCoupons: {
      type: [String],
      default: [],
    },
    wishlist: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true
        },
        dateAdded: {
          type: Date,
          default: Date.now
        }
      }
    ],
    referralCode:{
      type:String,
      required:false
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
