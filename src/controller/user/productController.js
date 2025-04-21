const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const User = require("../../models/userSchema");
const Offer = require("../../models/offerSchema");
const Address = require("../../models/addressSchema");

const applyOffers = async (products) => {
  const currentDate = new Date();

  const activeOffers = await Offer.find({
    status: true,
    startDate: { $lte: currentDate },
    endDate: { $gte: currentDate },
  });

  return products.map((product) => {
    const productWithOffer = product.toObject();

    const applicableOffers = activeOffers.filter(
      (offer) =>
        (offer.offerType === "product" &&
          offer.productId.includes(product._id)) ||
        (offer.offerType === "category" &&
          offer.categoryId.includes(product.category))
    );

    if (applicableOffers.length > 0) {
      const maxDiscount = Math.max(
        ...applicableOffers.map((offer) => offer.discount)
      );

      const discountedPrice = product.price * (1 - maxDiscount / 100);

      productWithOffer.originalPrice = product.price;
      productWithOffer.discountedPrice = Math.round(discountedPrice);
      productWithOffer.discountPercentage = maxDiscount;
    }

    return productWithOffer;
  });
};

const loadShop = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.session.userId });
    const wishlistProduct = user?.wishlist.map((val) => val.productId);

    // Parse query parameters
    const { sort, query, categoryId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = 9;
    const skip = (page - 1) * limit;

    // Set sort options
    let sortOption = { createdAt: -1 }; // Default sorting
    if (sort === "a-z") {
      sortOption = { name: 1 };
    } else if (sort === "z-a") {
      sortOption = { name: -1 };
    } else if (sort === "l-h") {
      sortOption = { price: 1 };
    } else if (sort === "h-l") {
      sortOption = { price: -1 };
    }

    // Get active categories
    const activeCategories = await Category.find({ status: true });
    const activeCategoryIds = activeCategories.map((category) => category._id);

    // Build filter object
    let filter = {
      status: true,
      category: { $in: activeCategoryIds },
    };

    // Apply category filter if provided
    if (categoryId) {
      const requestedCategory = await Category.findById(categoryId);
      if (requestedCategory && requestedCategory.status) {
        filter.category = categoryId;
      } else {
        filter.category = null; // Category not found or inactive
      }
    }

    // Apply search query if provided
    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ];
    }

    // Count total products for pagination
    const totalProducts = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / limit);

    // Get products with all filters applied
    const products = await Product.find(filter)
      .populate("category", "name")
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    const productsWithOffers = await applyOffers(products);
    const categories = await Category.find({ status: true });

    res.render("product-page", {
      products: productsWithOffers,
      categories,
      currentPage: page,
      totalPages,
      totalProducts,
      sort: sort || '',
      query: query || '',
      categoryId: categoryId || '',
      wishlistProduct,
    });
  } catch (error) {
    console.log("Error occurred while rendering shop page", error);
    res.status(500).send("Internal Server Error");
  }
};

// You can safely delete the searchProduct function as it's now consolidated into loadShop

const loadShopSingle = async (req, res) => {
  try {
    const productId = req.params.productId;
    const user = await User.findOne({ _id: req.session.userId });
    const wishlistProduct = user?.wishlist?.map((val) => val.productId) || [];

    const product = await Product.findOne({ _id: productId, status: true })
      .populate("reviews.userId", "username");

    if (!product) {
      return res.redirect("/shop");
    }

    // Initialize reviews if undefined
    product.reviews = product.reviews || [];

    const categoryId = product.category;
    const category = await Category.findById(categoryId);

    if (!category || !category.status) {
      return res.redirect("/shop");
    }

    const currentDate = new Date();
    const applicableOffers = await Offer.find({
      $or: [
        {
          offerType: "product",
          productId: productId,
          startDate: { $lte: currentDate },
          endDate: { $gte: currentDate },
          status: true,
        },
        {
          offerType: "category",
          categoryId: categoryId,
          startDate: { $lte: currentDate },
          endDate: { $gte: currentDate },
          status: true,
        },
      ],
    });

    let maxDiscount = 0;
    if (applicableOffers.length > 0) {
      maxDiscount = Math.max(
        ...applicableOffers.map((offer) => offer.discount)
      );
    }

    const originalPrice = product.price;
    const discountedPrice = originalPrice * (1 - maxDiscount / 100);

    const allProducts = await Product.find({
      category: categoryId,
      status: true,
      _id: { $ne: productId },
    }).limit(4);

    res.render("single-product", {
      product: {
        ...product.toObject(),
        originalPrice,
        discountedPrice,
        maxDiscount,
        applicableOffers,
      },
      allProducts: allProducts || [],
      wishlistProduct: wishlistProduct || [],
    });
  } catch (error) {
    console.log("Error loading shop single page:", error);
    res.redirect("/shop");
  }
};

const addReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    const userId = req.session.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please login to submit a review",
        login_required: true,
      });
    }

    if (!productId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: "Product ID, rating, and comment are required",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check if user already reviewed this product
    const existingReview = product.reviews.find(
      (review) => review.userId.toString() === userId.toString()
    );
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this product",
      });
    }

    // Add new review
    product.reviews.push({
      userId,
      rating: parseInt(rating),
      comment,
      date: new Date(),
    });

    // Update average rating and rating count
    const totalRatings = product.reviews.reduce((sum, review) => sum + review.rating, 0);
    product.averageRating = totalRatings / product.reviews.length;
    product.ratingCount = product.reviews.length;

    await product.save();

    return res.status(200).json({
      success: true,
      message: "Review submitted successfully",
    });
  } catch (error) {
    console.error("Error adding review:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit review",
      error: error.message,
    });
  }
};

const singleProductModal = async (req, res) => {
  try {
    console.log("fetching the single product page");
    const productId = req.params.productId;
    const product = await Product.findById(productId);

    console.log("product:", product);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    return res.json({ success: true, product });
  } catch (error) {
    console.log("error occured:", error);
  }
};

const productModal = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const findByCategory = async (req, res) => {
  try {
    console.log("Rendering the categorywise filtering page");
    const categoryId = req.params.categoryId;
    console.log("categoryId:", categoryId);
    
    // Get sort parameter from query
    const sort = req.query.sort || '';
    
    // Check if the category exists and is active
    const category = await Category.findOne({ _id: categoryId, status: true });
    if (!category) {
      return res.status(404).render('error', { message: 'Category not found or inactive' });
    }
    
    // Parse query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const skip = (page - 1) * limit;
    
    // Set sort options
    let sortOption = { createdAt: -1 }; // Default sorting
    if (sort === "a-z") {
      sortOption = { name: 1 };
    } else if (sort === "z-a") {
      sortOption = { name: -1 };
    } else if (sort === "l-h") {
      sortOption = { price: 1 };
    } else if (sort === "h-l") {
      sortOption = { price: -1 };
    }
    
    // Set up filter
    const filter = {
      category: categoryId,
      status: true
    };
    
    // Count total products for pagination
    const totalProducts = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / limit);
    
    // Get active categories for the sidebar
    const categories = await Category.find({ status: true });
    
    // Get products with pagination and sorting
    const products = await Product.find(filter)
      .populate("category", "name")
      .sort(sortOption)
      .skip(skip)
      .limit(limit);
    
    console.log("products:", products);
    
    // If user is logged in, get wishlist information
    let wishlistProduct = [];
    if (req.session.userId) {
      const user = await User.findOne({ _id: req.session.userId });
      if (user && user.wishlist) {
        wishlistProduct = user.wishlist.map((val) => val.productId);
      }
    }
    
    // Apply offers to products if the function exists
    const productsWithOffers = typeof applyOffers === 'function' ? 
      await applyOffers(products) : products;
    
    res.render("product-page", {
      products: productsWithOffers,
      category,
      categories,
      currentPage: page,
      totalPages,
      totalProducts,
      wishlistProduct,
      categoryId,
      sort, // Pass the sort variable to the template
      query: req.query.query || '' // Add query parameter for search functionality
    });
  } catch (error) {
    console.log("Error in findByCategory controller:", error);
    res.status(500).render('error', { message: 'Internal Server Error' });
  }
};

const searchProduct = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.session.userId });
    const wishlistProduct = user?.wishlist.map((val) => val.productId);
    
    // Set default sort option
    let sortOption = { createdAt: -1 };
    const { sort, query, categoryId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = 9; // Changed from 6 to 9 to match your snippet
    const skip = (page - 1) * limit;

    // Apply sorting logic
    if (sort === "a-z") {
      sortOption = { name: 1 };
    } else if (sort === "z-a") {
      sortOption = { name: -1 };
    } else if (sort === "l-h") {
      sortOption = { price: 1 };
    } else if (sort === "h-l") {
      sortOption = { price: -1 };
    }
    
    const searchFilter = {
      status: true,
      $or: [
        { name: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ],
    };

    // If categoryId is provided, add it to the filter
    if (categoryId) {
      searchFilter.category = categoryId;
    }

    const category = await Category.find();
    const totalProducts = await Product.countDocuments(searchFilter);
    const totalPages = Math.ceil(totalProducts / limit);
    const categories = await Category.find();
    
    // Apply the sortOption to the query
    const products = await Product.find(searchFilter)
      .populate("category", "name")
      .sort(sortOption) // Use the sortOption here
      .skip(skip)
      .limit(limit);

    res.render("product-page", {
      products,
      query: query || '',
      currentPage: page,
      totalPages,
      totalProducts,
      category,
      categories,
      sort: sort || '', 
      categoryId: categoryId || '',
      wishlistProduct,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

const loadWishlist = async (req, res) => {
  try {
    const userId = req.session.userId;

    const user = await User.findById(userId).populate({
      path: "wishlist.productId",
      model: "Product",
    });

    if (!user) {
      return res.status(404).render("error", { message: "User not found" });
    }

    const wishlist = {
      items: user.wishlist,
    };

    res.render("wishlist", { wishlist });
  } catch (error) {
    console.log(error);
    res.status(500).render("error", { message: "Server error" });
  }
};

const addToWishlist = async (req, res) => {
  try {
    console.log(req.body);

    const { productId, size } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    const userId = req.session.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please login to add items to wishlist",
        login_required: true,
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const existingItemIndex = user.wishlist.findIndex(
      (item) =>
        item.productId.toString() === productId &&
        (size ? item.size === size : true)
    );

    if (existingItemIndex > -1) {
      user.wishlist.splice(existingItemIndex, 1);
      await user.save();

      return res.status(200).json({
        success: true,
        message: "Product removed from wishlist",
        in_wishlist: false,
        wishlist_count: user.wishlist.length,
      });
    }

    user.wishlist.push({
      productId,
      size: size || undefined,
      dateAdded: new Date(),
    });

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Product added to wishlist successfully",
      in_wishlist: true,
      wishlist_count: user.wishlist.length,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed to update wishlist",
      error: error.message,
    });
  }
};

const addingTocart = async (req, res) => {
  try {
    const productId = req.params.productId;
    const product = await Product.findOne({ _id: productId });

    return res.status(200).json({
      success: true,
      product: product,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve product details",
      error: error.message,
    });
  }
};

const removeItemWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.session.userId;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $pull: { wishlist: { productId: productId } } },
      { new: true }
    );

    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Product removed from wishlist successfully",
      wishlist: updatedUser.wishlist,
    });
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

const clearWishlist = async (req, res) => {
  try {
    const userId = req.session.userId;

    await User.findByIdAndUpdate(
      userId,
      { $set: { wishlist: [] } },
      { new: true }
    );
    res.redirect("/wishlist");
  } catch (error) {
    console.log(error);
  }
};

const addAddressInCheckout = async (req, res) => {
  try {
    const userId = req.session.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const newAddress = {
      name: req.body.name,
      email: req.body.email || "",
      number: Number(req.body.number),
      houseName: req.body.street.split(",")[0] || req.body.street,
      street: req.body.street,
      city: req.body.city,
      state: req.body.state,
      country: req.body.country || "India",
      pincode: req.body.pincode,
      saveAs: req.body.saveAs || "Home",
      isDefault: req.body.isDefault || false,
    };

    const requiredFields = [
      "name",
      "number",
      "street",
      "city",
      "state",
      "pincode",
    ];
    for (const field of requiredFields) {
      if (!newAddress[field]) {
        return res.status(400).json({
          success: false,
          message: `Missing required field: ${field}`,
        });
      }
    }

    let addressDoc = await Address.findOne({ userId });
    console.log("Existing address doc:", addressDoc);

    if (addressDoc) {
      if (newAddress.isDefault) {
        addressDoc.address.forEach((addr) => (addr.isDefault = false));
      }
      addressDoc.address.push(newAddress);
      await addressDoc.save();
    } else {
      addressDoc = new Address({
        userId,
        address: [newAddress],
      });
      await addressDoc.save();
    }

    console.log("Address saved:", addressDoc);
    res.status(201).json({
      success: true,
      message: "Address added successfully",
      address: newAddress,
    });
  } catch (error) {
    console.error("Error adding address:", error);
    res.status(500).json({
      success: false,
      message: "Error adding address",
      error: error.message,
    });
  }
};

module.exports = {
  loadShop,
  singleProductModal,
  loadShopSingle,
  findByCategory,
  searchProduct,
  productModal,
  loadWishlist,
  addToWishlist,
  addingTocart,
  removeItemWishlist,
  clearWishlist,
  addAddressInCheckout,
  addReview,
};
