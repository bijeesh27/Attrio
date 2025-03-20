const Offer = require("../../models/offerSchema");
const Category = require("../../models/categorySchema");
const Product = require("../../models/productSchema");

const loadOffer = async (req, res) => {
  try {
    const searchQuery = req.query.query || "";
    console.log(searchQuery);
    const page = parseInt(req.query.page) || 1;
    const limit = 5;

    const searchFilter = searchQuery
      ? {
          $or: [{ offerName: { $regex: searchQuery, $options: "i" } }],
        }
      : {};

    const skip = (page - 1) * limit;

    const totaloffers = await Offer.countDocuments(searchFilter);
    const totalPages = Math.ceil(totaloffers / limit);

    const offers = await Offer.find(searchFilter)

      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.render("adminoffer", {
      searchQuery,
      offers,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
      },
      pages: Array.from({ length: totalPages }, (_, i) => i + 1),
    });
  } catch (error) {
    console.log(error);
  }
};

const loadAddOffer = async (req, res) => {
  try {
    const categories = await Category.find();
    const products = await Product.find();
    res.render("addoffer", { categories, products });
  } catch (error) {
    console.log(error);
  }
};

const addOffer = async (req, res) => {
  try {
    console.log(req.body);

    const {
      offerName,
      discount,
      offerType,
      startDate,
      endDate,
      productId,
      categoryId,
      status,
    } = req.body;

    const newOffer = new Offer({
      offerName,
      discount,
      startDate,
      endDate,
      productId,
      categoryId,
      offerType,
      status: status === "true" ? true : false,
    });
    await newOffer.save();
    res.redirect("/admin/offer");
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  loadOffer,
  loadAddOffer,
  addOffer,
};
