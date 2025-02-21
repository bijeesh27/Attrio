const User = require("../models/userSchema");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
dotenv.config();

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.redirect("/login");
    }
    let isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.redirect("/login");
    }
    req.session.isAuth = true;
    req.session.user = user.email;
    return res.redirect("/");
  } catch (error) {
    console.log("error occured while login time", error);
  }
};

const register = async (req, res) => {
  try {
    const { firstName, lastName, email, number, password, confirmPassword } =
      req.body;
    const user = await User.findOne({ email });
    if (user) {
      return res.redirect("/register");
    }

    if (password != confirmPassword) {
      return res.redirect("/register");
    }

    if (number < 10) {
      return res.redirect("/register");
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      firstName,
      lastName,
      email,
      number,
      password: hashedPassword,
    });
    await newUser.save();
    return res.redirect("/login");
  } catch (error) {
    console.log("error occured while registering new user", error);
  }
};
const forgot = async (req, res) => {
  try {
    res.render("forgot");
  } catch (error) {
    console.log("error occred while forgot password", error);
  }
};

const loadHome = async (req, res) => {
  try {
    return res.render("home");
  } catch (error) {
    console.log("error rendering home page", error);
  }
};

const loadLogin = async (req, res) => {
  try {
    return res.render("login");
  } catch (error) {
    console.log("error rendering login page", error);
  }
};

const loadRegister = async (req, res) => {
  try {
    return res.render("signup");
  } catch (error) {
    console.log("error rendering signup page", error);
  }
};

const loadCategory = async (req, res) => {
  try {
    return res.render("categories");
  } catch (error) {
    console.log("error rendering categorypage", error);
  }
};

const loadProductPage = async (req, res) => {
  try {
    return res.render("product-page");
  } catch (error) {
    console.log("error rendering product page", error);
  }
};

const loadForgotEmailverification = async (req, res) => {
  try {
    return res.render("forgotEmailVerification");
  } catch (error) {
    console.log("error rendering forgot email verification page", error);
  }
};

const loadForgot = async (req, res) => {
  try {
  } catch (error) {
    console.log("error rendering forgot page", error);
  }
};

const loadOtp = async (req, res) => {
  try {
    return res.render("otp");
  } catch (error) {
    console.log("error rendering otp page", error);
  }
};

module.exports = {
  loadHome,
  loadLogin,
  login,
  loadRegister,
  register,
  loadCategory,
  loadProductPage,
  loadForgotEmailverification,
  loadForgot,
  forgot,
  loadOtp,
};
