const { closeDelimiter } = require("ejs");
const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");

const loadShop = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const skip = (page - 1) * limit;

    const totalProducts = await Product.countDocuments({ status: true });
    const totalPages = Math.ceil(totalProducts / limit);
    const category=await Category.find()
    const products = await Product.find({ status: true })
      .sort({ createdAt: -1 })
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
    const product = await Product.findOne({ _id: productId });
    const allProducts = await Product.find();
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

module.exports = {
  loadShop,
  singleProduct,
  loadShopSingle,
  findByCategory,
};
