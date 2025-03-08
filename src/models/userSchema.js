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
      saprse:true,default:null
    },
    number: {
      type: String,
      required: false,
      unique: false,
      saprse:true,
      default:null
    },
    password: {
      type: String,
      required: false,
    },
    dob:{
      type:String,
      required:false
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
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
