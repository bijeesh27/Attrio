const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
dotenv.config();
const Category = require("../../models/categorySchema");
const nodemailer = require("nodemailer");

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
    console.log("req.body:", req.body);
    const { username, email, number, password, confirmPassword } =
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
    const otp = generateOtp();
    const emailSent = await sendVerificationEmail(email, otp);
    console.log("emailsent", emailSent);
    if (!emailSent) {
      return res.json("email-error");
    }
    req.session.userOtp = otp;
    req.session.userData = { username, email, number, password };
    console.log("otp:", otp);
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
      res.redirect("/");
    } else {
      res.redirect("/otp");
    }
  } catch (error) {
    console.error("Error in OTP verification:", error);
    return res.json({ success: false, message: "Verification failed" });
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
    // Get current page from query or default to 1
    const page = parseInt(req.query.page) || 1;
    const limit = 3; // 6 products per page
    const skip = (page - 1) * limit;

    // Get total count for pagination calculation
    const totalProducts = await Product.countDocuments({ status: true });
    const totalPages = Math.ceil(totalProducts / limit);

    // Fetch products for current page
    const category = await Category.find();
    const product = await Product.find({ status: true })
      .sort({ createdAt: -1 })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
    // If you need category details
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

const loadForgot = async (req, res) => {
  try {
  } catch (error) {
    console.log("error rendering forgot page", error);
  }
};

const loadOtp = async (req, res) => {
  try {
    return res.render("otp",{email:req.session.userData.email});
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
  verifyOtp,
};
