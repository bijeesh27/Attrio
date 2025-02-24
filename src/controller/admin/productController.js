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
const loadProducts = async (req, res) => {
  try {
    const products = await Product.find().populate("category","name");
    console.log("products:",products);
    return res.render("products", { products });
  } catch (error) {
    console.log(error);
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

const blockProduct=async (req,res) => {
    try {
        const productId=req.params.productId
        const product=await Product.findById({_id:productId})
        const status=!product.status
        await Product.updateOne({_id:productId},{$set:{status:status}})
        res.redirect("/admin/products")
    } catch (error) {
        console.log("error occured while blocking a product",error);
    }
}


module.exports = {
  loadAddProduct,
  loadProducts,
  addProduct,
  blockProduct,
};
