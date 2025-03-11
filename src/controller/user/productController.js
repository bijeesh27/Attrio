const { closeDelimiter, name } = require("ejs");
const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const { options } = require("../../router/userRouter");

const loadShop = async (req, res) => {
  try {
    let sortOption={createdAt: -1}
    console.log("All query parameters:", req.query); // Log all parameters
    const { sort } = req.query;
    console.log("Sort parameter:", sort);
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const skip = (page - 1) * limit;

    
    if (sort === 'a-z') {
      sortOption = { name: 1 };
    } else if (sort === 'z-a') {
      sortOption = { name: -1 };
    } else if (sort === 'l-h') {
      sortOption = { price: 1 };
    } else if (sort === 'h-l') {
      sortOption = { price: -1 };
    }

    const totalProducts = await Product.countDocuments({ status: true });
    const totalPages = Math.ceil(totalProducts / limit);
    const category=await Category.find()
    const products = await Product.find({ status: true })
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    res.render("product-page", {
      products,
      category,
      currentPage: page,
      totalPages,
      totalProducts,
    });
  } catch (error) {
    console.log("error occured while rendering shop page", error);
  }
};

const singleProduct = async (req, res) => {
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

const loadShopSingle = async (req, res) => {
  try {
    const productId = req.params.productId;
    const product = await Product.findOne({ _id: productId ,status:true});
    const categoryId=product.category
    console.log("categoryIddd:",categoryId);
    const allProducts = await Product.find({category:categoryId});
    console.log(product);
    res.render("single-product", { product, allProducts });
  } catch (error) {
    console.log("error loading shop single page");
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
    const category=await Category.findOne({_id:categoryId})
    console.log("!!!!!!!",category);
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
    });
  } catch (error) {}
};


const searchProduct=async (req,res) => {
  try {
    console.log("req.query:",req.query);
    const { query }=req.query
    console.log(query);

    const searchFilter={
      status:true,
      $or:[
        {name:{$regex:query,$options:"i"}},
        {description:{$regex:query, $options:"i"}}
      ]
    }

    const product=await Product.find(searchFilter)
    const category=await Category.find()

          // Pagination
          const page = parseInt(req.query.page) || 1;
          const limit = 6;
          const skip = (page - 1) * limit;
    
          // Count total search results
          const totalProducts = await Product.countDocuments(searchFilter);
          const totalPages = Math.ceil(totalProducts / limit);
    
          // Fetch products
          const products = await Product.find(searchFilter)
            .populate('category', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
    
          res.render("products", {
            products,
            searchQuery: query,
            currentPage: page,
            totalPages,
            totalProducts,
            category
          });
    console.log(product);
   
  } catch (error) {
    console.log(error);
  }
}


module.exports = {
  loadShop,
  singleProduct,
  loadShopSingle,
  findByCategory,
  searchProduct,
};
