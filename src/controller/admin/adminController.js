const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const Orders = require("../../models/orderSchema");
const Offer = require("../../models/offerSchema");

const bcrypt = require("bcrypt");

const loadDashboard = async (req, res) => {
  try {
    const currentDate = new Date();
    const filter = req.query.filter || "monthly";

    // Calculate date range based on filter
    let startDate;
    switch (filter) {
      case "daily":
        startDate = new Date(currentDate);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "weekly":
        startDate = new Date(currentDate);
        startDate.setDate(currentDate.getDate() - 7);
        break;
      case "monthly":
        startDate = new Date(currentDate);
        startDate.setMonth(currentDate.getMonth() - 1);
        break;
      case "yearly":
        startDate = new Date(currentDate);
        startDate.setFullYear(currentDate.getFullYear() - 1);
        break;
      default:
        startDate = new Date(currentDate);
        startDate.setMonth(currentDate.getMonth() - 1);
    }

    const [
      totalRevenueResult,
      totalOrdersCount,
      deliveredOrdersCount,
      pendingOrdersCount,
      cancelledOrdersCount,
      totalProductsCount,
      monthlyEarningResult,
      totalCustomersResult,
      salesData,
      bestSellingProducts,
      bestSellingCategories,
      orderStatusStats,
      latestOrders,
    ] = await Promise.all([
      Orders.aggregate([
        {
          $match: { createdAt: { $gte: startDate }, orderStatus: "Delivered" },
        },
        { $group: { _id: null, total: { $sum: "$orderAmount" } } },
      ]),
      Orders.countDocuments({
        createdAt: { $gte: startDate },
      }),
      Orders.countDocuments({
        createdAt: { $gte: startDate },
        orderStatus: "Delivered",
      }),
      Orders.countDocuments({
        createdAt: { $gte: startDate },
        orderStatus: { $in: ["Pending", "Processing", "Shipped"] },
      }),
      Orders.countDocuments({
        createdAt: { $gte: startDate },
        orderStatus: "Cancelled",
      }),
      Product.countDocuments({ status: true }),

      // Monthly Earning
      Orders.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(
                currentDate.getFullYear(),
                currentDate.getMonth(),
                1
              ),
            },
            orderStatus: "Delivered",
          },
        },
        { $group: { _id: null, total: { $sum: "$orderAmount" } } },
      ]),

      // Total Customers
      Orders.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: "$userId" } },
        { $count: "total" },
      ]),

      // Sales Chart Data
      Orders.aggregate([
        {
          $match: { createdAt: { $gte: startDate }, orderStatus: "Delivered" },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format:
                  filter === "daily"
                    ? "%Y-%m-%d"
                    : filter === "weekly"
                    ? "%Y-%U"
                    : filter === "monthly"
                    ? "%Y-%m"
                    : "%Y",
                date: "$createdAt",
              },
            },
            total: { $sum: "$orderAmount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Best Selling Products
      Orders.aggregate([
        {
          $match: { createdAt: { $gte: startDate }, orderStatus: "Delivered" },
        },
        { $unwind: "$orderedItem" },
        {
          $group: {
            _id: "$orderedItem.productId",
            totalSold: { $sum: "$orderedItem.quantity" },
            totalRevenue: { $sum: "$orderedItem.totalProductPrice" },
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: "$product" },
        { $sort: { totalSold: -1 } },
        { $limit: 10 },
      ]),

      // Best Selling Categories
      Orders.aggregate([
        {
          $match: { createdAt: { $gte: startDate }, orderStatus: "Delivered" },
        },
        { $unwind: "$orderedItem" },
        {
          $lookup: {
            from: "products",
            localField: "orderedItem.productId",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: "$product" },
        {
          $group: {
            _id: "$product.category",
            totalSold: { $sum: "$orderedItem.quantity" },
            totalRevenue: { $sum: "$orderedItem.totalProductPrice" },
          },
        },
        {
          $lookup: {
            from: "categories",
            localField: "_id",
            foreignField: "_id",
            as: "category",
          },
        },
        { $unwind: "$category" },
        { $sort: { totalSold: -1 } },
        { $limit: 10 },
      ]),

      // Order Status Stats
      Orders.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: "$orderStatus",
            count: { $sum: 1 },
          },
        },
      ]),

      // Latest Orders
      Orders.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("userId", "username name")
        .populate("deliveryAddress"),
    ]);

    const totalRevenue = totalRevenueResult[0]?.total || 0;
    const monthlyEarning = monthlyEarningResult[0]?.total || 0;
    const totalCustomers = totalCustomersResult[0]?.total || 0;

    const averageOrderValue =
      deliveredOrdersCount > 0 ? totalRevenue / deliveredOrdersCount : 0;

    const statusPercentages = orderStatusStats.map((status) => ({
      status: status._id,
      count: status.count,
      percentage: Math.round((status.count / totalOrdersCount) * 100),
    }));

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const monthlyDataPromises = monthNames.map(async (month, index) => {
      const monthStart = new Date(currentDate.getFullYear(), index, 1);
      const monthEnd = new Date(currentDate.getFullYear(), index + 1, 0);

      const monthlyRevenue = await Orders.aggregate([
        {
          $match: {
            createdAt: { $gte: monthStart, $lte: monthEnd },
            orderStatus: "Delivered",
          },
        },
        { $group: { _id: null, total: { $sum: "$orderAmount" } } },
      ]);

      return {
        month: month,
        revenue: monthlyRevenue[0]?.total || 0,
      };
    });

    const monthlyData = await Promise.all(monthlyDataPromises);

    const tasks = [
      {
        title: "Update product inventory",
        assignedTo: "Admin",
        dueDate: new Date(currentDate.setDate(currentDate.getDate() + 2)),
      },
      {
        title: "Follow up with suppliers",
        assignedTo: "Manager",
        dueDate: new Date(currentDate.setDate(currentDate.getDate() + 3)),
      },
      {
        title: "Process pending returns",
        assignedTo: "Support",
        dueDate: new Date(currentDate.setDate(currentDate.getDate() + 1)),
      },
      {
        title: "Prepare monthly sales report",
        assignedTo: "Admin",
        dueDate: new Date(currentDate.setDate(currentDate.getDate() + 5)),
      },
    ];

    const previousPeriodStart = new Date(startDate);
    switch (filter) {
      case "daily":
        previousPeriodStart.setDate(previousPeriodStart.getDate() - 1);
        break;
      case "weekly":
        previousPeriodStart.setDate(previousPeriodStart.getDate() - 7);
        break;
      case "monthly":
        previousPeriodStart.setMonth(previousPeriodStart.getMonth() - 1);
        break;
      case "yearly":
        previousPeriodStart.setFullYear(previousPeriodStart.getFullYear() - 1);
        break;
    }

    const previousPeriodRevenue = await Orders.aggregate([
      {
        $match: {
          createdAt: { $gte: previousPeriodStart, $lt: startDate },
          orderStatus: "Delivered",
        },
      },
      { $group: { _id: null, total: { $sum: "$orderAmount" } } },
    ]);

    const previousRevenue = previousPeriodRevenue[0]?.total || 0;
    const revenueGrowth =
      previousRevenue > 0
        ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
        : 100;

    res.render("dashboard", {
      title: "Admin Dashboard",
      filter: filter,
      revenue: totalRevenue,
      totalOrders: totalOrdersCount,
      deliveredOrders: deliveredOrdersCount,
      pendingOrders: pendingOrdersCount,
      cancelledOrders: cancelledOrdersCount,
      products: totalProductsCount,
      totalCustomers: totalCustomers,
      averageOrderValue: averageOrderValue,
      salesData: salesData,
      revenueGrowth: revenueGrowth.toFixed(2),
      bestSellingProducts: bestSellingProducts,
      bestSellingCategories: bestSellingCategories,
      statusPercentages: statusPercentages,
      monthlyData: monthlyData,
      latestOrders: latestOrders,
      tasks: tasks,
    });
  } catch (error) {
    console.error("Error loading dashboard:", error);
    res.status(500).render("admin/error", {
      title: "Error",
      error: "Failed to load dashboard data",
      details: process.env.NODE_ENV === "development" ? error.message : null,
    });
  }
};

const loadLogin = async (req, res) => {
  try {
    return res.render("admin-login");
  } catch (error) {
    console.log("error occured while rendering admin login page", error);
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await User.findOne({ email: email });
    if (!admin.isAdmin) {
      req.flash("error_msg", "Invalid Admin Email");
      return res.redirect("/admin/login");
    }
    let isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      req.flash("error_msg", "Invalid Password");
      return res.redirect("/admin/login");
    }
    req.session.isAdmin = true;
    return res.redirect("/admin/");
  } catch (error) {
    console.log("error occured while login admin", error);
  }
};
const logout = async (req, res) => {
  try {
    req.session.destroy();
    res.redirect("/admin/login");
  } catch (error) {
    console.log("error ocuured while admin logouting", error);
  }
};

module.exports = {
  loadDashboard,
  loadLogin,
  login,
  logout,
};
