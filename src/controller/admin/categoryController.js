const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");

const loadCategories = async (req, res) => {
  try {
    const categories = await Category.find({});
    return res.render("adminCategories", { categories });
  } catch (error) {
    console.log(error);
  }
};

const loadAddCategory = async (req, res) => {
  try {
    return res.render("add-category");
  } catch (error) {
    console.log("error occured while rendering add category page", error);
  }
};

const addCategory = async (req, res) => {
  try {
    console.log("req.body:", req.body);
    const { name, description } = req.body;
    const existingCategory = await Product.findOne({ name: name });
    if (existingCategory) {
      return res.redirect("/admin/add-category");
    }
    const newCategory = new Category({
      name,
      description,
    });
    await newCategory.save();
    res.redirect("/admin//categories");
  } catch (error) {
    console.log("error occured while adding product");
  }
};

const blockCategory = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    const category = await Category.findById({ _id: categoryId });
    const status = !category.status;
    await Category.updateOne({ _id: categoryId }, { $set: { status: status } });
    res.redirect("/admin/categories");
  } catch (error) {
    console.log("error occured while blocking category", error);
  }
};

const loadEditCategory=async (req,res) => {
  try {
    const categoryId=req.params.categoryId
    const category=await Category.findOne({_id:categoryId})
    console.log(category);
    return res.render('editCategory',{category})
  } catch (error) {
    console.log("Error rendering edit category page",error);
  }
}

const editCategory = async (req, res) => {
  try {
    console.log("req.body:", req.body);
    const categoryId=req.params.categoryId
    const { name, description } = req.body;

    const existingCategory = await Category.findOne({_id:categoryId});
    console.log("existingCategory",existingCategory);
    if(!existingCategory){

      console.log("this category not existing");
      res.redirect("/admin/editCategory")
    }
    console.log("category:",categoryId);
    
   await Category.updateOne({_id:categoryId},{$set:{name:name,description:description}})
    res.redirect("/admin/categories");
  } catch (error) {
    console.log("error occured while adding product");
  }
};

module.exports = {
  loadAddCategory,
  loadCategories,
  addCategory,
  blockCategory,
  loadEditCategory,
 editCategory





};
