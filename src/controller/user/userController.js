const User = require("../../models/userSchema");
const Product=require("../../models/productSchema")
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
const Category = require("../../models/categorySchema");
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

    if (!user.status) {
      return res.redirect("/login");
    }

    req.session.isAuth = true;
    req.session.email = user.email;
    req.session.userId = user._id.toString();
    return res.redirect("/");
  } catch (error) {
    console.log("error occured while login time", error);
  }
};

const register = async (req, res) => {
  try {
    console.log("req.body:",req.body);
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
    const product=await Product.find()
    const category=await Category.find()
    console.log("product:",product);
    return res.render("home",{product,category});
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

const loadProfile = async (req, res) => {
  try {
    return res.render("profile");
  } catch (error) {
    console.log("error rendering profile page", error);
  }
};

const logout = async (req, res) => {
  try {
    req.session.destroy();
    res.redirect("/login");
  } catch (error) {
    console.log("error occured while logout", error);
  }
};

const loadShop=async (req,res) => {
  try {
    const products=await Product.find()
    return res.render('product-page',{products})
  } catch (error) {
    console.log("error occured while rendering shop page",error);
  }
}

module.exports = {
  loadHome,
  loadLogin,
  login,
  loadRegister,
  register,
  loadForgotEmailverification,
  loadForgot,
  forgot,
  loadOtp,
  loadProfile,
  logout,
  loadShop
};
