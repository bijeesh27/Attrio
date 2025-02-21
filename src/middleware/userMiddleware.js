const userModel = require("../models/userSchema");

const ifLogged = async (req, res, next) => {
  try {
    if (req.session.user) {
      next();
    } else {
      return res.redirect("/login");
    }
  } catch (error) {
    console.log("error form middleware", error);
  }
};

const ifLoggedOut=async (req,res,next) => {
    try {
        if(!req.session.user){
            return res.redirect('/login')
        }else{
            next()
        }
    } catch (error) {
        console.log("error from middleware",error);
    }
}


module.exports={
    ifLogged,
    ifLoggedOut
}