const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");

const loadUser = async (req, res) => {
  try {
    // Parse page number, default to 1 if not provided
    const page = parseInt(req.query.page) || 1;
    
    // Number of users per page
    const limit = 5;
    
    // Get search query from request, default to empty string
    const searchQuery = req.query.query || '';

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Construct search filter
    const searchFilter = searchQuery 
      ? { 
          isAdmin: false, 
          $or: [
            { username: { $regex: searchQuery, $options: 'i' } },
            { email: { $regex: searchQuery, $options: 'i' } }
          ]
        } 
      : { isAdmin: false };

    // Count total number of users matching the filter
    const totalUsers = await User.countDocuments(searchFilter);
    
    // Calculate total pages
    const totalPages = Math.ceil(totalUsers / limit);

    // Fetch users with pagination and sorting
    const users = await User.find(searchFilter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    // Debugging logs
    console.log('Search Query:', searchQuery);
    console.log('Current Page:', page);
    console.log('Total Users:', totalUsers);
    console.log('Total Pages:', totalPages);
    console.log('Fetched Users Count:', users.length);

    // Render the user management page
    return res.render("user", {
      users,
      searchQuery,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalUsers,
      },
      // Create an array of page numbers for pagination
      pages: Array.from({ length: totalPages }, (_, i) => i + 1),
    });
  } catch (error) {
    console.error("Error loading users:", error);
    return res.status(500).render("error", { 
      message: "Failed to load users", 
      error: error.message 
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
