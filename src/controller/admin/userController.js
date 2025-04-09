const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");

const loadUser = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;

    const limit = 5;

    const searchQuery = req.query.query || "";

    const skip = (page - 1) * limit;

    const searchFilter = searchQuery
      ? {
          isAdmin: false,
          $or: [
            { username: { $regex: searchQuery, $options: "i" } },
            { email: { $regex: searchQuery, $options: "i" } },
          ],
        }
      : { isAdmin: false };

    const totalUsers = await User.countDocuments(searchFilter);
    const totalPages = Math.ceil(totalUsers / limit);
    const users = await User.find(searchFilter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    return res.render("user", {
      users,
      searchQuery,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalUsers,
      },

      pages: Array.from({ length: totalPages }, (_, i) => i + 1),
    });
  } catch (error) {
    console.error("Error loading users:", error);
    return res.status(500).render("error", {
      message: "Failed to load users",
      error: error.message,
    });
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
