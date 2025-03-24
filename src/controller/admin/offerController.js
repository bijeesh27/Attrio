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

    const offer=await Offer.find({offerName})

    if (offer) {
      return res.status(409).json({
          success: false,
          message: "Offer already exists. Please add a new offer."
      });
  }

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
const loadEditOffer = async (req, res) => {
  try {
    const offerId = req.params.offerId;
    const offer = await Offer.findOne({ _id: offerId });
    const categories = await Category.find();
    const products = await Product.find();
    return res.render("editoffer", { offer, categories, products });
  } catch (error) {
    console.log(error);
  }
};

const editOffer = async (req, res) => {
  try {
    console.log(req.body);
    const {
      offerName,
      discount,
      offerType,
      startDate,
      endDate,
      categoryId,
      productId,
    } = req.body;
    const offerId = req.params.offerId;
    const offer = await Offer.find({ _id: offerId });

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Offer not found",
      });
    }

    await Offer.findOneAndUpdate(
      { _id: offerId },
      {
        $set: {
          offerName,
          discount,
          offerType,
          startDate,
          endDate,
          categoryId,
          productId,
        },
      }
    );
    res.redirect('/admin/offer')
  } catch (error) {
    console.log(error);
  }
};

const blockOffer = async (req, res) => {
  try {
    const offerId = req.params.offerId;
    const offer = await Offer.findOne({ _id: offerId });

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Offer not found",
      });
    }

    const status = !offer.status;
    await Offer.updateOne({ _id: offerId }, { $set: { status: status } });

    // Only send JSON response, no redirect
    return res.json({
      success: true,
      message: `Coupon ${status ? "activated" : "blocked"} successfully`,
      newStatus: status,
    });
  } catch (error) {
    console.error("Error updating coupon status:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while updating the coupon status.",
    });
  }
};

module.exports = {
  loadOffer,
  loadAddOffer,
  addOffer,
  blockOffer,
  editOffer,
  loadEditOffer,
};
