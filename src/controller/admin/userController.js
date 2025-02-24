const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");

const loadUser = async (req, res) => {
  try {
    const users = await User.find({});
    return res.render("user", { users });
  } catch (error) {
    console.log(error);
  }
};

const blockUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById({ _id: userId });
    console.log(user);
    const status = !user.status;
    await User.updateOne({ _id: userId }, { $set: { status: status } });
    res.redirect("/admin/user");
  } catch (error) {
    console.log("error occured while blocking user", error);
  }
};

module.exports = {
  loadUser,
  blockUser,
};
