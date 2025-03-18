const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Cart = require("../../models/cartSchema");
const Wallet = require("../../models/walletSchema");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
dotenv.config();
const Category = require("../../models/categorySchema");
const nodemailer = require("nodemailer");
const passport = require("passport");

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      req.flash("error_msg", "Invalid email or password");
      return res.redirect("/login");
    }
    let isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      req.flash("error_msg", "Invalid password.");
      return res.redirect("/login");
    }

    if (!user.status) {
      req.flash(
        "error_msg",
        "Your account has been blocked. Please contact support."
      );
      return res.redirect("/login");
    }

    req.session.isAuth = true;
    req.session.email = user.email;
    req.session.userId = user._id.toString();
    req.session.user = user;
    const cart = await Cart.findOne({ userId: req.session.userId });

    req.flash("success_msg", "successfully loggined");
    return res.redirect("/");
  } catch (error) {
    console.log("error occured while login time", error);
  }
};

function generateOtp() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

let sendVerificationEmail = async (email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: "587",
      secure: false,
      auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD,
      },
    });

    const info = {
      from: process.env.NODEMAILER_EMAIL,
      to: email,
      subject: "verify your account",
      text: `your otp is ${otp}`,
      html: `<b>Your otp ${otp}</b>`,
    };

    await transporter.sendMail(info);

    return true;
  } catch (error) {
    console.log("error from send verification email", error);
  }
};

const register = async (req, res) => {
  try {
    const { username, email, number, password, confirmPassword } = req.body;
    const user = await User.findOne({ email });
    if (user) {
      req.flash("error_msg", "User Already Exist");
      return res.redirect("/register");
    }

    if (password != confirmPassword) {
      return res.redirect("/register");
    }

    if (number < 10) {
      return res.redirect("/register");
    }
    const otp = generateOtp();
    const emailSent = await sendVerificationEmail(email, otp);
    console.log("emailsent", emailSent);
    if (!emailSent) {
      return res.json("email-error");
    }
    req.session.userOtp = otp;
    req.session.userData = { username, email, number, password };
    console.log("otp:", otp);
    req.flash("success_msg", "OTP sent");
    return res.redirect("/otp");
  } catch (error) {
    console.log("error occured while registering new user", error);
  }
};

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {}
};

const verifyOtp = async (req, res) => {
  try {
    console.log("req.body", req.body);
    const otp = Object.values(req.body).join("");
    console.log(otp);
    console.log("userOtp", req.session.userOtp);
    if (otp == req.session.userOtp) {
      console.log("1");
      const user = req.session.userData;
      console.log("user:", user);
      const passwordHash = await securePassword(user.password);
      console.log("passwordHash:", passwordHash);
      const newUser = new User({
        username: user.username,
        email: user.email,
        number: user.number,
        password: passwordHash,
      });
      console.log("newUser", newUser);
      await newUser.save();

      req.session.isAuth = true;
      req.session.userId = newUser._id;
      req.session.email = newUser.email;

      const userId = req.session.userId;
      const newWallet = new Wallet({
        userId,
        balance: 0,
        transaction: [],
      });
      await newWallet.save();

      req.flash("success_msg", "Registerd Successfully");
      res.redirect("/");
    } else {
      req.flash("error_msg", "invalid OTP");
      res.redirect("/otp");
    }
  } catch (error) {
    console.error("Error in OTP verification:", error);
    return res.json({ success: false, message: "Verification failed" });
  }
};

const resendOtp = async (req, res) => {
  try {
    const newOtp = generateOtp();
    console.log(newOtp);
    req.session.userOtp = newOtp;
    const user = req.session.userData;
    const email = user.email;
    console.log(email);
    const emailSent = await sendVerificationEmail(email, newOtp);
    console.log(emailSent);
    req.flash("success_msg", "OTP has been sent again successfully");
    res.redirect("/otp");
  } catch (error) {
    console.log(error);
  }
};

const googleSignIn = passport.authenticate("google", {
  scope: ["email", "profile"],
});

const googleCallback = passport.authenticate("google", {
  successRedirect: "/",
  failureRedirect: "/authfailure",
});

const authfailure = (req, res) => {
  res.send("something wrong while authenticating....");
};

const forgot = async (req, res) => {
  try {
    const { email } = req.body;
    const otp = generateOtp();
    console.log("f otp", otp);
    console.log(email);
    const emailSent = await sendVerificationEmail(email, otp);
    console.log(emailSent);
    const user = await User.findOne({ email: email });
    console.log(user);
    if (!user) {
      req.flash("error_msg", "The user doesn't Exist");
      return res.redirect("/forgot");
    }
    req.session.email = email;
    req.session.user = user._id;
    req.session.userOtp = otp;
    req.flash("success_msg", "Email Verified and OTP sent");
    res.redirect("/verifyfotp");
  } catch (error) {
    console.log("error occred while forgot password", error);
  }
};

const verifyForgetOtp = async (req, res) => {
  try {
    const otp = Object.values(req.body).join("");
    if (otp == req.session.userOtp) {
      req.flash("success_msg", "OTP Verified");
      return res.redirect("/changepassword");
    }
    req.flash("error_msg", "Invalid OTP");
    return res.redirect("/verifyfotp");
  } catch (error) {
    console.log(error);
  }
};

const changePassword = async (req, res) => {
  try {
    console.log(req.body);
    const { newPassword, confirmPassword } = req.body;
    const userId = req.session.user;

    const HashedPassword = await bcrypt.hash(newPassword, 10);

    await User.findByIdAndUpdate(
      { _id: userId },
      { $set: { password: HashedPassword } }
    );
    req.flash("success_msg", "Password change successfully");
    res.redirect("/login");
  } catch (error) {
    console.log(error);
  }
};

const resendForgetOtp = async (req, res) => {
  try {
    const newOtp = generateOtp();
    console.log(newOtp);
    req.session.userOtp = newOtp;
    console.log("req.session.email", req.session.email);
    const email = req.session.email;
    const emailSent = await sendVerificationEmail(email, newOtp);
    console.log(emailSent);
    req.flash("success_msg", "OTP has been sent again successfully");
    res.redirect("/verifyfotp");
  } catch (error) {
    console.log(error);
  }
};

const loadHome = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 3;
    const skip = (page - 1) * limit;

    const totalProducts = await Product.countDocuments({ status: true });
    const totalPages = Math.ceil(totalProducts / limit);

    const category = await Category.find({ status: true });
    const activeCategories = await Category.find({ status: true });
    const activeCategoryIds = activeCategories.map((category) => category._id);
    const product = await Product.find({
      status: true,
      category: { $in: activeCategoryIds },
    })
      .sort({ createdAt: -1 })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.render("home", {
      product,
      currentPage: page,
      totalPages,
      totalProducts,
      category,
    });
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

const loadOtp = async (req, res) => {
  try {
    return res.render("otp", { email: req.session.userData.email });
  } catch (error) {
    console.log("error rendering otp page", error);
  }
};

const loadChangePassword = async (req, res) => {
  try {
    return res.render("forgot");
  } catch (error) {
    console.log(error);
  }
};

const loadvarifyForgotOtp = async (req, res) => {
  try {
    res.render("f-otp", { email: req.session.email });
  } catch (error) {
    console.log(error);
  }
};

const loadAbout = async (req, res) => {
  try {
    return res.render("about");
  } catch (error) {
    console.log(error);
  }
};

const loadContact = async (req, res) => {
  try {
    return res.render("contact");
  } catch (error) {
    console.log(error);
  }
};

const logout = async (req, res) => {
  try {
    req.flash("success_msg", "Successfully logged out.");
    req.session.destroy();
    res.redirect("/login");
  } catch (error) {
    console.log("error occured while logout", error);
  }
};

module.exports = {
  loadHome,
  loadLogin,
  login,
  loadRegister,
  register,
  loadForgotEmailverification,
  forgot,
  loadOtp,
  logout,
  verifyOtp,
  authfailure,
  loadAbout,
  loadContact,
  resendOtp,
  loadvarifyForgotOtp,
  verifyForgetOtp,
  changePassword,
  loadChangePassword,
  resendForgetOtp,
};
