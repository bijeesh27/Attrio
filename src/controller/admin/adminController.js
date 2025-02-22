const User = require("../../models/userSchema");

const loadDashboard = async (req, res) => {
  try {
    return res.render("dashboard");
  } catch (error) {
    console.log(error);
  }
};
const loadAddProduct = async (req, res) => {
  try {
    return res.render("add-product");
  } catch (error) {
    console.log(error);
  }
};
const loadCategories = async (req, res) => {
  try {
    return res.render("adminCategories");
  } catch (error) {
    console.log(error);
  }
};
const loadProducts = async (req, res) => {
  try {
    return res.render("products");
  } catch (error) {
    console.log(error);
  }
};
const loadUser = async (req, res) => {
  try {
    const users = await User.find({});
    return res.render("user", { users });
  } catch (error) {
    console.log(error);
  }
};

const addProduct = async (req, res) => {
  try {
    const {
      name,
      category,
      description,
      price,
      discountPrice,
      totalstock,
      status,
      stock,
      image,
    } = req.body;
    console.log(req.body);
  } catch (error) {
    console.log("error occured while adding product", error);
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
  loadDashboard,
  loadAddProduct,
  loadUser,
  loadProducts,
  loadCategories,
  addProduct,
  blockUser,
};
