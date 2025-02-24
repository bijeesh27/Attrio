const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const bcrypt = require("bcrypt");

const loadDashboard = async (req, res) => {
  try {
    return res.render("dashboard");
  } catch (error) {
    console.log(error);
  }
};

const loadLogin = async (req, res) => {
  try {
    return res.render("admin-login");
  } catch (error) {
    console.log("error occured while rendering admin login page", error);
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await User.findOne({ email: email });
    if (!admin.isAdmin) {
      return res.redirect("/admin/login");
    }
    let isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.redirect("/admin/login");
    }
    req.session.isAdmin = true;
    return res.redirect("/admin/");
  } catch (error) {
    console.log("error occured while login admin", error);
  }
};
const logout = async (req, res) => {
  try {
    req.session.destroy();
    res.redirect("/admin/login");
  } catch (error) {
    console.log("error ocuured while admin logouting", error);
  }
};

module.exports = {
  loadDashboard,
  loadLogin,
  login,
  logout,
};
