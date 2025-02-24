const Product=require("../../models/productSchema")

const loadProductPage = async (req, res) => {
  try {
    return res.render("product-page");
  } catch (error) {
    console.log("error rendering product page", error);
  }
};

module.exports = {
  loadProductPage,
};
