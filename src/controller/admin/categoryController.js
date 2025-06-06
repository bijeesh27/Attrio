const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");

const loadCategories = async (req, res) => {
  try {

    const searchQuery = req.query.query || '';
    console.log(searchQuery);
  
    const page = parseInt(req.query.page) || 1;
    const limit = 10;

    const skip = (page - 1) * limit;

    const searchFilter = searchQuery 
    ? { 
         
        $or: [
          { name: { $regex: searchQuery, $options: 'i' } },
          { description: { $regex: searchQuery, $options: 'i' } }
        ]
      } 
    : {};

    const totalCategories = await Category.countDocuments(searchFilter);
    const totalPages = Math.ceil(totalCategories / limit);

    const categories = await Category.find(searchFilter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
console.log("Categoriessssss",categories);
    return res.render("adminCategories", {
      categories,
      searchQuery,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalCategories,
      },
      pages: Array.from({ length: totalPages }, (_, i) => i + 1),
    });
  } catch (error) {
    console.log("Error loading categories:", error);
    return res
      .status(500)
      .render("error", { message: "Failed to load categories" });
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
    const Cname=name.toUpperCase()
    const existingCategory = await Category.findOne({ name: Cname });
    if (existingCategory) {
      req.flash("error_msg", "The Category Already Exist");
      return res.redirect("/admin/add-category");
    }
    const newCategory = new Category({
      name:Cname,
      description,
    });
    await newCategory.save();
    res.redirect("/admin/categories");
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

const loadEditCategory = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    const category = await Category.findOne({ _id: categoryId });
    console.log(category);
    return res.render("editCategory", { category });
  } catch (error) {
    console.log("Error rendering edit category page", error);
  }
};

const editCategory = async (req, res) => {
  try {
    console.log("req.body:", req.body);
    const categoryId = req.params.categoryId;
    const { name, description } = req.body;
    const Cname=name.toUpperCase()

    const existingCategory = await Category.findOne({ name: Cname });
    if (existingCategory) {
      req.flash("error_msg", "The Category Already Exist");
      return res.redirect("/admin/add-category");
    }
    console.log("category:", categoryId);

    await Category.updateOne(
      { _id: categoryId },
      { $set: { name: Cname, description: description } }
    );
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
  editCategory,
};
