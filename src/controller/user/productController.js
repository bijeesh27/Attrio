const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");

const loadShop = async (req, res) => {
  try {
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
    
    res.render("single-product", { product, allProducts });
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



module.exports = {
  loadShop,
  singleProductModal,
  loadShopSingle,
  findByCategory,
  searchProduct,
  productModal
};
