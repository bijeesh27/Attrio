const User = require("../../models/userSchema");
const Address = require("../../models/addressSchema");
const Orders = require("../../models/orderSchema");
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");
const Wallet = require("../../models/walletSchema");

const updateProfile = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.redirect("/login");
    }

    const { username, email, number, dob } = req.body;
    const userId = req.session.userId;

    const user = await User.findById(userId);

    if (email !== user.email) {
      return res.render("user/editprofile", {
        user,
        error: "Email changes require verification. Please try again.",
      });
    }

    user.username = username;
    user.number = number;
    user.dob = dob;

    await user.save();

    return res.redirect("/profile");
  } catch (error) {
    console.error("Error updating profile:", error);
    return res.redirect("/profile");
  }
};

const updateProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No image uploaded" });
    }

    const userId = req.session.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (user.profileimage && user.profileimage.length > 0) {
      user.profileimage.forEach((imagePath) => {
        try {
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
          }
        } catch (err) {
          console.log("Error deleting old profile image:", err);
        }
      });
    }

    const imagePath = req.file.path;
    user.profileimage = [imagePath];
    await user.save();

    const imageUrl = "/" + imagePath.replace(/\\/g, "/");

    res.json({
      success: true,
      message: "Profile image updated successfully",
      imageUrl: imageUrl,
    });
  } catch (error) {
    console.log("Error updating profile image:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile image",
    });
  }
};

const changeNewPassword = async (req, res) => {
  try {
    console.log(req.body);

    const { currentPassword, newPassword, confirmPassword } = req.body;

    const user = await User.findOne({ _id: req.session.userId });

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      req.flash("error_msg", "The current password is wrong");
      return res.redirect("/changenewpassword");
    }

    const HashedPassword = await bcrypt.hash(newPassword, 10);

    await User.updateOne(
      { _id: user._id },
      { $set: { password: HashedPassword } }
    );

    res.redirect("/profile");

    console.log(user);
  } catch (error) {
    console.log(error);
  }
};

const loadProfile = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.session.userId });
    const wishlistCount=user.wishlist.length

    if (user && user.profileimage && user.profileimage.length > 0) {
      user.profileImage = "/" + user.profileimage[0].replace(/\\/g, "/");
    }
    const totalOrders=await Orders.countDocuments({userId:user._id})

    return res.render("profile", { user ,totalOrders,wishlistCount});
  } catch (error) {
    console.log("error rendering profile page", error);
  }
};

const loadEditprofile = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.session.userId });

    if (user && user.profileimage && user.profileimage.length > 0) {
      user.profileImage = "/" + user.profileimage[0].replace(/\\/g, "/");
    }

    return res.render("editprofile", { user });
  } catch (error) {
    console.log(error);
  }
};

const loadOrder = async (req, res) => {
  try {
    const userId = req.session.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    const totalOrder = await Orders.countDocuments({userId});
    const totalPages = Math.ceil(totalOrder / limit);
    
    const user = await User.findOne({ _id: userId });
    const orders = await Orders.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    console.log("user", user);
    console.log("orders", orders);
    return res.render("order", {
      user,
      orders,
      currentPage: page,
      totalPages,
      totalOrder,
    });
  } catch (error) {
    console.log(error);
  }
};

const loadAddress = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.session.email });
    const userId = req.session.userId;

    const addressDoc = await Address.findOne({ userId: userId });

    const addresses = addressDoc ? addressDoc.address : [];

    return res.render("address", { user, addresses });
  } catch (error) {
    console.log(error);
  }
};

const setDefault = async (req, res) => {
  try {
    const addressId = req.params.addressId;
    const userId = req.session.userId;

    await Address.updateMany(
      { userId: userId },
      { $set: { "address.$[].isDefault": false } }
    );

    await Address.updateOne(
      { userId: userId, "address._id": addressId },
      { $set: { "address.$.isDefault": true } }
    );
    res.redirect("/address");
  } catch (error) {
    console.log(error);
  }
};

const deleteAddress = async (req, res) => {
  try {
    const addressId = req.params.addressId;

    await Address.updateOne(
      { "address._id": addressId },
      { $pull: { address: { _id: addressId } } }
    );

    res.redirect("/address");
  } catch (error) {
    console.log(error);
  }
};

const loadChangeNewPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.session.email });
    return res.render("changepassword", { user });
  } catch (error) {
    console.log(error);
  }
};
const loadWallet = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.session.userId });
    const wallet = await Wallet.findOne({ userId: req.session.userId });
    
    // Sort transactions by date in descending order (most recent first)
    if (wallet && wallet.transaction) {
      wallet.transaction.sort((a, b) => b.date - a.date);
    }
    
    return res.render("wallet", { 
      user, 
      wallet 
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while loading wallet");
  }
};
const loadAddAddress = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.session.email });
    const address = {};
    return res.render("addaddress", { user, address });
  } catch (error) {
    console.log(error);
  }
};
const loadEditAddress = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.session.email });
    const addressId = req.params.addressId;

    const addressDoc = await Address.findOne(
      { "address._id": addressId },
      { "address.$": 1 }
    );

    const specificAddressIndex = addressDoc.address.findIndex(
      (addr) => addr._id.toString() === addressId
    );

    if (specificAddressIndex === -1) {
      return res.status(404).send("Specific address not found");
    }

    const address = addressDoc;
    const specificAddress = addressDoc.address[specificAddressIndex];

    return res.render("editaddress", { user, address, specificAddress });
  } catch (error) {
    console.log(error);
  }
};

const editAddress = async (req, res) => {
  try {
    const {
      saveAs,
      name,
      email,
      number,
      houseName,
      street,
      city,
      state,
      pincode,
      country,
    } = req.body;
    const addressId = req.params.addressId;
    const userId = req.session.userId;
    const updatedAddress = await Address.findOneAndUpdate(
      { userId: userId, "address._id": addressId },
      {
        $set: {
          "address.$.saveAs": saveAs,
          "address.$.name": name,
          "address.$.email": email,
          "address.$.number": number,
          "address.$.houseName": houseName,
          "address.$.street": street,
          "address.$.city": city,
          "address.$.state": state,
          "address.$.pincode": pincode,
          "address.$.country": country,
        },
      },
      { new: true }
    );
    console.log("updatedAddress", updatedAddress);
    res.redirect("/address");
  } catch (error) {
    console.log(error);
  }
};
const addAddress = async (req, res) => {
  try {
    const {
      saveAs,
      name,
      email,
      number,
      houseName,
      street,
      city,
      state,
      pincode,
      country,
    } = req.body;

    const newAddressData = {
      name,
      email,
      number,
      houseName,
      street,
      city,
      state,
      country,
      pincode,
      saveAs,
      isDefault: false,
    };

    const existingAddress = await Address.findOne({
      userId: req.session.userId,
    });

    if (existingAddress) {
      existingAddress.address.push(newAddressData);
      await existingAddress.save();
    } else {
      const newAddress = new Address({
        userId: req.session.userId,
        address: [newAddressData],
      });
      await newAddress.save();
    }
    res.redirect("/address");
  } catch (error) {
    console.log(error);
  }
};

const sendEmail = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated" });
    }

    const { newEmail } = req.body;

    r;
    const existingUser = await User.findOne({
      email: newEmail,
      _id: { $ne: req.session.userId },
    });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already in use by another account",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    req.session.emailChangeOTP = {
      code: otp,
      email: newEmail,
      expiresAt: new Date(Date.now() + 5 * 60000),
    };

    return res.json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    console.error("Error sending OTP:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const veryfyChangeEmail = async (req, rse) => {
  if (!req.session.userId || !req.session.emailChangeOTP) {
    return res.redirect("/profile");
  }

  res.render("user/verify-email-change", {
    email: req.session.emailChangeOTP.email,
  });
};

const changeEmail = async (req, res) => {
  try {
    if (!req.session.userId || !req.session.emailChangeOTP) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid session" });
    }

    const { otp } = req.body;
    const { code, email, expiresAt } = req.session.emailChangeOTP;

    if (new Date() > new Date(expiresAt)) {
      return res
        .status(400)
        .json({ success: false, message: "OTP has expired" });
    }

    if (otp !== code) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    await User.findByIdAndUpdate(req.session.userId, { email: email });

    delete req.session.emailChangeOTP;

    return res.json({ success: true, message: "Email updated successfully" });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
module.exports = {
  loadProfile,
  loadOrder,
  loadAddress,
  loadChangeNewPassword,
  loadEditprofile,
  updateProfile,
  updateProfileImage,
  loadWallet,
  loadAddAddress,
  addAddress,
  changeNewPassword,
  loadEditAddress,
  editAddress,
  setDefault,
  deleteAddress,
  sendEmail,
  veryfyChangeEmail,
  changeEmail,
};
