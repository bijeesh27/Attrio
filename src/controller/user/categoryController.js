const Category = require("../../models/categorySchema");

const loadCategory = async (req, res) => {
    try {
        const category=await Category.find()
      return res.render("categories",{category});
    } catch (error) {
      console.log("error rendering categorypage", error);
    }
  };



  module.exports={
    loadCategory
  }