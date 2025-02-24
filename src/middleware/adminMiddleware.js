const isAdmin = async (req, res, next) => {
  try {
    if (req.session.isAdmin) {
      next();
    } else {
      res.redirect("/admin/login");
    }
  } catch (error) {
    console.log("error occured from is admin middleware");
  }
};

const isAdminLogged = async (req, res, next) => {
  try {
    if (req.session.isAdmin) {
      return res.redirect("/admin/");
    } else {
      next();
    }
  } catch (error) {
    console.log("error occured form admin middleware", error);
  }
};

module.exports = {
  isAdmin,
  isAdminLogged
};
