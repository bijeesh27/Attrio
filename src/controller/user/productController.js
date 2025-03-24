const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const User=require('../../models/userSchema')

const loadShop = async (req, res) => {
  try {
    const user=await User.findOne({_id:req.session.userId})
    const wishlistProduct=user?.wishlist.map((val)=>val.productId)
    let sortOption = { createdAt: -1 };
    const { sort, query, categoryId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const skip = (page - 1) * limit;
    
    // Sorting logic
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
    const activeCategoryIds = activeCategories.map(category => category._id);
    
    // Filter logic
    let filter = { 
      status: true,
      category: { $in: activeCategoryIds } // Only include products with active categories
    };
    
    // If categoryId is specified, ensure it's active before applying the filter
    if (categoryId) {
      const requestedCategory = await Category.findById(categoryId);
      if (requestedCategory && requestedCategory.status) {
        filter.category = categoryId;
      } else {
        // If the requested category is inactive, return no products
        filter.category = null;
      }
    }
    
    // Search logic
    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ];
    }
    
    const totalProducts = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / limit);
    
    // Only fetch active categories for the sidebar/filter menu
    const categories = await Category.find({ status: true });
    
    const products = await Product.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    res.render("product-page", {
      products,
      categories,
      currentPage: page,
      totalPages,
      totalProducts,
      sort,
      query,
      categoryId,
      wishlistProduct
    });
  } catch (error) {
    console.log("error occurred while rendering shop page", error);
    res.status(500).send("Internal Server Error");
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

const productModal=async (req,res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId);
    
    if (!product) {
        return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json(product);
} catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Server error' });
} 
}

const loadShopSingle = async (req, res) => {
  try {
    const productId = req.params.productId;
    
    const user=await User.findOne({_id:req.session.userId})
    const wishlistProduct=user?.wishlist.map((val)=>val.productId)
    const product = await Product.findOne({ _id: productId, status: true });
    
    if (!product) {
      return res.redirect('/shop'); 
    }
    
   
    const categoryId = product.category;
    const category = await Category.findById(categoryId);
    
    if (!category || !category.status) {
      return res.redirect('/shop'); 
    }
    
  
    const allProducts = await Product.find({ 
      category: categoryId,
      status: true,
      _id: { $ne: productId } 
    }).limit(4); 
    
    res.render("single-product", { product, allProducts,wishlistProduct });
  } catch (error) {
    console.log("Error loading shop single page:", error);
    res.redirect('/shop');
  }
};
const findByCategory = async (req, res) => {
  try {
    console.log("rendering the categorywise filtering page");
    const categoryId = req.params.categoryId;
    console.log("categoryId:", categoryId);
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const skip = (page - 1) * limit;
    

    const totalProducts = await Product.countDocuments({ status: true });
    const totalPages = Math.ceil(totalProducts / limit);
    const category = await Category.findOne({ _id: categoryId });
    const categories = await Category.find();
    console.log("!!!!!!!", category);
    const products = await Product.find({
      category: categoryId,
      status: true,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    console.log("products:", products);
    res.render("products", {
      products,
      category,
      currentPage: page,
      totalPages,
      totalProducts,
      categories,
    });
  } catch (error) {}
};

const searchProduct = async (req, res) => {
  try {
    console.log("req.query:", req.query);
    const { query } = req.query;
    console.log(query);

    const searchFilter = {
      status: true,
      $or: [
        { name: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ],
    };

    const product = await Product.find(searchFilter);
    const category = await Category.find();

    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const skip = (page - 1) * limit;

    const totalProducts = await Product.countDocuments(searchFilter);
    const totalPages = Math.ceil(totalProducts / limit);

    const categories = await Category.find();
    const products = await Product.find(searchFilter)
      .populate("category", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.render("products", {
      products,
      searchQuery: query,
      currentPage: page,
      totalPages,
      totalProducts,
      category,
      categories,
    });
    console.log(product);
  } catch (error) {
    console.log(error);
  }
};


const loadWishlist = async (req, res) => {
  try {
    const userId = req.session.userId;
    
    // Use findById and populate the product details
    const user = await User.findById(userId)
      .populate({
        path: 'wishlist.productId',
        model: 'Product'
      });
    
    if (!user) {
      return res.status(404).render('error', { message: 'User not found' });
    }
    

    
    // Format as expected by your template
    const wishlist = {
      items: user.wishlist
    };
    
    res.render('wishlist', { wishlist });
  } catch (error) {
    console.log(error);
    res.status(500).render('error', { message: 'Server error' });
  }
};


const addToWishlist = async (req, res) => {
  try {
    console.log(req.body);
    
    const { productId, size } = req.body;
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }
    
    // Change this line - use req.session.userId instead of req.user?._id
    const userId = req.session.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Please login to add items to wishlist',
        login_required: true
      });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const existingItemIndex = user.wishlist.findIndex(
      item => item.productId.toString() === productId && 
              (size ? item.size === size : true)
    );
    
    if (existingItemIndex > -1) {
      user.wishlist.splice(existingItemIndex, 1);
      await user.save();
      
      return res.status(200).json({
        success: true,
        message: 'Product removed from wishlist',
        in_wishlist: false,
        wishlist_count: user.wishlist.length
      });
    }
    
    user.wishlist.push({
      productId,
      size: size || undefined,
      dateAdded: new Date()
    });
    
    await user.save();
    
    return res.status(200).json({
      success: true,
      message: 'Product added to wishlist successfully',
      in_wishlist: true,
      wishlist_count: user.wishlist.length
    });
    
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update wishlist',
      error: error.message
    });
  }
};

// Server-side function should return product details
const addingTocart = async (req, res) => {
  try {
    const productId = req.params.productId;
    const product = await Product.findOne({_id: productId});
    
    // Return the product data along with success status
    return res.status(200).json({
      success: true,
      product: product  // Include the product data
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve product details',
      error: error.message
    });
  }
};

const removeItemWishlist=async (req,res) => {
  try {
    const { productId } = req.params;
    const userId = req.session.userId // Assuming you have user authentication middleware

   
    // Find user and update wishlist by removing the product
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $pull: { wishlist: { productId: productId } } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true, 
      message: 'Product removed from wishlist successfully',
      wishlist: updatedUser.wishlist
    });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
}

const clearWishlist=async (req,res) => {
  try {
    const userId=req.session.userId
    
    await User.findByIdAndUpdate(
      userId,
      { $set: { wishlist: [] } },
      { new: true } 
    );
    res.redirect('/wishlist')
  } catch (error) {
    console.log(error);
  }
}

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
};
