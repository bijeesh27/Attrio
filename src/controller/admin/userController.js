const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");

const loadUser = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;

    const skip = (page - 1) * limit;

    const totalUsers = await User.countDocuments();
    const totalPages = Math.ceil(totalUsers / limit);

    const users = await User.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    return res.render("user", {
      users,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalUsers,
      },

      pages: Array.from({ length: totalPages }, (_, i) => i + 1),
    });
  } catch (error) {
    console.log("Error loading users:", error);
    return res.status(500).render("error", { message: "Failed to load users" });
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
