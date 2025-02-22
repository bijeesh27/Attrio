const userModel = require("../models/userSchema");

const ifLogged = async (req, res, next) => {
  try {
    if (req.session.isAuth) {
      res.redirect("/");
    } else {
      next();
    }
  } catch (error) {
    console.log("error form middleware", error);
  }
};

const logged = async (req, res, next) => {
  try {
    const user = await userModel.findOne({ _id: req.session.userId });
    console.log("user:", user);
    if (req.session.isAuth && user && user.status === true) {
      next();
    } else {
      req.session.isAuth = false;
      res.redirect("/login");
    }
  } catch (error) {
    console.log("error occured", error);
  }
};

module.exports = {
  ifLogged,
  logged,
};
