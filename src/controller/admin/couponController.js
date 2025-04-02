const Coupon = require("../../models/couponSchema");

const loadCoupon = async (req, res) => {
  try {
    const searchQuery = req.query.query || "";
    console.log(searchQuery);
    const page = parseInt(req.query.page) || 1;
    const limit = 5;

    const searchFilter = searchQuery
      ? {
          $or: [{ couponCode: { $regex: searchQuery, $options: "i" } }],
        }
      : {};

    const skip = (page - 1) * limit;

    const totalcoupons = await Coupon.countDocuments(searchFilter);
    const totalPages = Math.ceil(totalcoupons / limit);

    const coupons = await Coupon.find(searchFilter)

      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.render("admincoupon", {
      searchQuery,
      coupons,
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

const loadAddCoupon = async (req, res) => {
  try {
    return res.render("addcoupon");
  } catch (error) {
    console.log(error);
  }
};

const addCoupon = async (req, res) => {
  try {
    const {
      couponCode,
      discountType,
      discountValue,
      minPurchaseAmount,
      maxRedemption,
      expiryDate,
      status,
      description,
    } = req.body;

    const newCoupon = new Coupon({
      couponCode,
      type:
        discountType === "percentage" ? "percentageDiscount" : "flatDiscount",
      discount: discountValue,
      minPurchase: minPurchaseAmount,
      maxRedeem: maxRedemption,
      expiry: expiryDate,
      status: status === "active",
      description,
    });

    await newCoupon.save();

    res.redirect("/admin/coupon");
  } catch (error) {
    console.log(error);
  }
};

const editCoupon = async (req, res) => {
  try {
    const couponId = req.params.couponId;
    const dbCoupon = await Coupon.findOne({ _id: couponId });
    const coupon = {
      _id: dbCoupon._id,
      couponCode: dbCoupon.couponCode,
      discountType:
        dbCoupon.type === "percentageDiscount" ? "percentage" : "fixed",
      discountValue: dbCoupon.discount,
      minPurchaseAmount: dbCoupon.minPurchase,
      maxRedemption: dbCoupon.maxRedeem,
      expiryDate: dbCoupon.expiry,
      status: dbCoupon.status ? "active" : "inactive",
      description: dbCoupon.description,
      usedCount: dbCoupon.usedCount || 0, 
    };
    res.render("editcoupon", { coupon });
  } catch (error) {
    console.log(error);
  }
};

const updateCoupon = async (req,res) => {
  try {
    const {
      couponCode,
      discountType,
      discountValue,
      minPurchaseAmount,
      maxRedemption,
      expiryDate,
      description,
    } = req.body;


    const couponData = {
      couponCode,
      type:
        discountType === "percentage" ? "percentageDiscount" : "flatDiscount",
      discount: Number(discountValue),
      minPurchase: Number(minPurchaseAmount || 0),
      maxRedeem: Number(maxRedemption || 0),
      expiry: new Date(expiryDate),
      
      description,
    };

    await Coupon.findByIdAndUpdate(req.params.couponId, couponData);
    res.redirect("/admin/coupon");
  } catch (error) {
    console.error("Error updating coupon:", error);
    res.status(500).send("Error updating coupon");
  }
};

const blockCoupon = async (req, res) => {
    try {
      const couponId = req.params.couponId;
      const coupon = await Coupon.findOne({_id: couponId});
      
      if (!coupon) {
        return res.status(404).json({
          success: false,
          message: 'Coupon not found'
        });
      }
      
      const status = !coupon.status;
      await Coupon.updateOne({_id: couponId}, {$set: {status: status}});
      
      
      return res.json({ 
        success: true,
        message: `Coupon ${status ? 'activated' : 'blocked'} successfully`,
        newStatus: status
      });
    } catch (error) {
      console.error('Error updating coupon status:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'An error occurred while updating the coupon status.'
      });
    }
  };
module.exports = {
  loadCoupon,
  loadAddCoupon,
  addCoupon,
  editCoupon,
  blockCoupon,
  updateCoupon,
};
