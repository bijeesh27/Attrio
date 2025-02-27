const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");

const loadAddProduct = async (req, res) => {
  try {
    const categories = await Category.find({});
    return res.render("add-product", { categories });
  } catch (error) {
    console.log(error);
  }
};
const loadEditProduct = async (req, res) => {
  try {
    const productId = req.params.productId;
    const categories = await Category.find({});
    const product = await Product.findOne({ _id: productId });
    return res.render("editProduct", { categories, product });
  } catch (error) {
    console.log(error);
  }
};

const loadProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;

    const skip = (page - 1) * limit;

    const totalProducts = await Product.countDocuments();

    const products = await Product.find()
      .populate("category", "name")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    return res.render("products", {
      products,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalProducts,
      },
      pages: Array.from({ length: totalPages }, (_, i) => i + 1),
    });
  } catch (error) {
    console.log("Error loading products:", error);
    return res
      .status(500)
      .render("error", { message: "Failed to load products" });
  }
};

const addProduct = async (req, res) => {
  try {
    console.log("req.body:", req.body);
    const existingProduct = await Product.findOne({ name: req.body.name });
    if (existingProduct) {
      return res.redirect("/admin/products");
    }
    const totalstock =
      parseInt(req.body.s) +
      parseInt(req.body.m) +
      parseInt(req.body.l) +
      parseInt(req.body.xl);
    console.log(totalstock);
    console.log("req.file:", req.files);
    const image = req.files.map((file) => file.path);
    console.log("image:", image);
    // In your route handler
    const productData = new Product({
      name: req.body.name,
      category: req.body.category,
      price: parseInt(req.body.price),
      description: req.body.description,
      stock: [
        { size: "S", quantity: parseInt(req.body.s) },
        {
          size: "M",
          quantity: parseInt(req.body.m),
        },
        {
          size: "L",
          quantity: parseInt(req.body.l),
        },
        {
          size: "XL",
          quantity: parseInt(req.body.xl),
        },
      ],
      totalstock,
      image,
    });
    console.log("product data", productData);
    await productData.save();
    res.redirect("/admin/products");
  } catch (error) {
    console.log("error occured while adding product", error);
  }
};
const editProduct = async (req, res) => {
  try {
    const productId = req.params.productId;
    const product = await Product.findOne({ _id: productId });
    console.log("req.body:", req.body);

    const image = req.files.map((file) => file.path);

    // Fix the totalstock calculation to use the correct structure
    const totalstock =
      parseInt(req.body.stock.S || 0) +
      parseInt(req.body.stock.M || 0) +
      parseInt(req.body.stock.L || 0) +
      parseInt(req.body.stock.XL || 0);

    await Product.updateOne(
      { _id: productId },
      {
        $set: {
          name: req.body.name,
          category: req.body.category,
          price: parseInt(req.body.price),
          description: req.body.description,
          stock: [
            { size: "S", quantity: parseInt(req.body.stock.S || 0) },
            { size: "M", quantity: parseInt(req.body.stock.M || 0) },
            { size: "L", quantity: parseInt(req.body.stock.L || 0) },
            { size: "XL", quantity: parseInt(req.body.stock.XL || 0) },
          ],
          totalstock,
          image,
        },
      }
    );

    res.redirect("/admin/products");
  } catch (error) {
    console.log("error occurred while adding product", error);
  }
};
const blockProduct = async (req, res) => {
  try {
    const productId = req.params.productId;
    const product = await Product.findById({ _id: productId });
    const status = !product.status;
    await Product.updateOne({ _id: productId }, { $set: { status: status } });
    res.redirect("/admin/products");
  } catch (error) {
    console.log("error occured while blocking a product", error);
  }
};

module.exports = {
  loadAddProduct,
  loadProducts,
  addProduct,
  blockProduct,
  loadEditProduct,
  editProduct,
};
