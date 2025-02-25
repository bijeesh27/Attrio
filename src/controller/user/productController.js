const { closeDelimiter } = require("ejs");
const Product = require("../../models/productSchema");

// const loadProductPage = async (req, res) => {
//   try {
//     const categoryId=req.params.categoryId   
//     console.log("categoryId:",categoryId);
//     const products=await Product.find({category:categoryId})
//     console.log("products",products);
//     return res.render("product-page",{products});
//   } catch (error) {
//     console.log("error rendering product page", error);
//   }
// };

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

module.exports = {
  // loadProductPage,
  singleProduct,
};
