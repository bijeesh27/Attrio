const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const Orders = require("../../models/orderSchema");
const Offer=require('../../models/offerSchema')
const PDFDocument = require('pdfkit');
const excel4node = require('excel4node');
const moment = require('moment');
const bcrypt = require("bcrypt");

const loadDashboard = async (req, res) => {
  try {
    // Get overall order statistics
    const totalOrders = await Orders.countDocuments();

    // Get revenue statistics
    const revenueStats = await Orders.aggregate([
      {
        $match: {
          paymentStatus: "Completed",
          orderStatus: { $ne: "Cancelled" },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$orderAmount" },
          averageOrderValue: { $avg: "$orderAmount" },
        },
      },
    ]);

    // Get monthly order statistics for the chart
    const currentYear = new Date().getFullYear();
    const monthlyOrders = await Orders.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(`${currentYear}-01-01`),
            $lte: new Date(`${currentYear}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 },
          revenue: { $sum: "$orderAmount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Get recent orders
    const recentOrders = await Orders.find()
      .populate("userId", "name email")
      .populate("orderedItem.productId", "name images")
      .sort({ createdAt: -1 })
      .limit(10);

    // Get orders by status
    const ordersByStatus = await Orders.aggregate([
      {
        $group: {
          _id: "$orderStatus",
          count: { $sum: 1 },
        },
      },
    ]);

    // Calculate percentages for the donut chart
    const totalOrderCount = ordersByStatus.reduce(
      (sum, status) => sum + status.count,
      0
    );
    const statusPercentages = ordersByStatus.map((status) => ({
      status: status._id,
      percentage: Math.round((status.count / totalOrderCount) * 100),
    }));

    // Format data for monthly chart
    const monthlyData = Array(12)
      .fill(0)
      .map((_, i) => {
        const monthData = monthlyOrders.find((m) => m._id === i + 1);
        return {
          month: new Date(0, i).toLocaleString("default", { month: "short" }),
          orders: monthData ? monthData.count : 0,
          revenue: monthData ? monthData.revenue : 0,
        };
      });

    // Get top selling products
    const topProducts = await Orders.aggregate([
      { $unwind: "$orderedItem" },
      {
        $group: {
          _id: "$orderedItem.productId",
          totalQuantity: { $sum: "$orderedItem.quantity" },
          totalRevenue: { $sum: "$orderedItem.totalProductPrice" },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 3 },
      {
        $lookup: {
          from: "products", // Name of your products collection
          localField: "_id",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $project: {
          name: { $arrayElemAt: ["$productDetails.name", 0] },
          description: { $arrayElemAt: ["$productDetails.description", 0] },
          totalQuantity: 1,
          totalRevenue: 1,
          salesPercentage: {
            $multiply: [{ $divide: ["$totalQuantity", 100] }, 100],
          }, // This will be adjusted later
        },
      },
    ]);

    // Calculate total quantity for percentage
    const totalQuantity = topProducts.reduce(
      (sum, product) => sum + product.totalQuantity,
      0
    );
    topProducts.forEach((product) => {
      product.salesPercentage = Math.round(
        (product.totalQuantity / totalQuantity) * 100
      );
    });

    // Get tasks (placeholder for demo)
    const tasks = [
      {
        id: 1,
        title: "Update product catalog",
        assignedTo: "Mark",
        completed: false,
      },
      {
        id: 2,
        title: "Process pending orders",
        assignedTo: "Team A",
        completed: false,
      },
      {
        id: 3,
        title: "Resolve customer complaints",
        assignedTo: "Janis",
        completed: false,
      },
      {
        id: 4,
        title: "Update website banners",
        assignedTo: "Dianna",
        completed: false,
      },
      {
        id: 5,
        title: "Prepare monthly report",
        assignedTo: "Team B",
        completed: false,
      },
    ];

    // Render the dashboard with all the data
    res.render("dashboard", {
      totalOrders,
      revenue: revenueStats[0]?.totalRevenue || 0,
      averageOrderValue: revenueStats[0]?.averageOrderValue || 0,
      monthlyData,
      statusPercentages,
      topProducts,
      recentOrders,
      tasks,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).send("Error loading dashboard");
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
      return res.redirect("/admin/login");
    }
    let isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
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
const generateReport = async (req, res, period) => {
  try {
    const { range, startDate, endDate, format } = req.query;

    // Determine date range
    let start, end;
    const now = moment();
    if (range === "custom" && startDate && endDate) {
      start = moment(startDate).startOf("day");
      end = moment(endDate).endOf("day");
    } else {
      switch (range || period) {
        case "day":
          start = now.clone().startOf("day");
          end = now.clone().endOf("day");
          break;
        case "week":
          start = now.clone().startOf("week");
          end = now.clone().endOf("week");
          break;
        case "month":
          start = now.clone().startOf("month");
          end = now.clone().endOf("month");
          break;
        case "year":
          start = now.clone().startOf("year");
          end = now.clone().endOf("year");
          break;
        default:
          start = now.clone().startOf(period);
          end = now.clone().endOf(period);
      }
    }

    // Fetch orders within date range
    const orders = await Orders.find({
      createdAt: { $gte: start.toDate(), $lte: end.toDate() },
    }).populate("orderedItem.productId");

    // Fetch offers for discount calculation
    const offerIds = [
      ...new Set(
        orders.flatMap((o) =>
          o.orderedItem.map((i) => i.offer_id).filter((id) => id)
        )
      ),
    ];
    const offers = await Offer.find({ _id: { $in: offerIds } });

    // Process orders
    const processedOrders = orders.map((order) => {
      let subtotal = 0;
      let offerDiscount = 0;

      order.orderedItem.forEach((item) => {
        const originalPrice = item.productPrice;
        const offer = offers.find(
          (o) => o._id.toString() === item.offer_id?.toString()
        );
        const offerPrice = offer
          ? originalPrice - (originalPrice * offer.discount) / 100
          : originalPrice;
        const itemSubtotal = originalPrice * item.quantity;
        const itemDiscountedTotal = offerPrice * item.quantity;

        subtotal += itemSubtotal;
        offerDiscount += itemSubtotal - itemDiscountedTotal;
      });

      const couponDiscount = order.couponDiscount || 0;
      return {
        ...order.toObject(),
        subtotal,
        offerDiscount,
        couponDiscount,
      };
    });

    // Calculate summary
    const summary = {
      totalOrders: processedOrders.length,
      overallSubtotal: processedOrders.reduce((sum, o) => sum + o.subtotal, 0),
      overallOfferDiscount: processedOrders.reduce(
        (sum, o) => sum + o.offerDiscount,
        0
      ),
      overallCouponDiscount: processedOrders.reduce(
        (sum, o) => sum + o.couponDiscount,
        0
      ),
      overallOrderAmount: processedOrders.reduce(
        (sum, o) => sum + o.orderAmount,
        0
      ),
    };

    const filter = { range: range || period, startDate, endDate };

    if (format === "pdf") {
      // Generate PDF
      const doc = new PDFDocument();
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${period}-sales-report.pdf"`
      );
      res.setHeader("Content-Type", "application/pdf");
      doc.pipe(res);

      doc
        .fontSize(20)
        .text(
          `${period.charAt(0).toUpperCase() + period.slice(1)} Sales Report`,
          { align: "center" }
        );
      doc.moveDown();
      doc
        .fontSize(12)
        .text(
          `Date Range: ${start.format("YYYY-MM-DD")} to ${end.format(
            "YYYY-MM-DD"
          )}`
        );
      doc.moveDown();

      // Table Header
      doc.text(
        "Order #    Date    Subtotal    Offer Discount    Coupon Discount    Total Amount",
        { continued: true }
      );
      doc.moveDown(0.5);

      // Table Rows
      processedOrders.forEach((order) => {
        doc.text(
          `${order.orderNumber}    ${moment(order.createdAt).format(
            "YYYY-MM-DD"
          )}    $${order.subtotal.toFixed(2)}    $${order.offerDiscount.toFixed(
            2
          )}    $${order.couponDiscount.toFixed(
            2
          )}    $${order.orderAmount.toFixed(2)}`
        );
        doc.moveDown(0.3);
      });

      // Summary
      doc.moveDown();
      doc.text("Summary", { underline: true });
      doc.text(`Total Orders: ${summary.totalOrders}`);
      doc.text(`Overall Subtotal: $${summary.overallSubtotal.toFixed(2)}`);
      doc.text(
        `Overall Offer Discount: $${summary.overallOfferDiscount.toFixed(2)}`
      );
      doc.text(
        `Overall Coupon Discount: $${summary.overallCouponDiscount.toFixed(2)}`
      );
      doc.text(
        `Overall Sales Amount: $${summary.overallOrderAmount.toFixed(2)}`
      );

      doc.end();
    } else if (format === "excel") {
      // Generate Excel
      const wb = new excel4node.Workbook();
      const ws = wb.addWorksheet(`${period} Sales Report`);

      // Headers
      const headers = [
        "Order #",
        "Date",
        "Subtotal",
        "Offer Discount",
        "Coupon Discount",
        "Total Amount",
      ];
      headers.forEach((header, i) => ws.cell(1, i + 1).string(header));

      // Data
      processedOrders.forEach((order, row) => {
        ws.cell(row + 2, 1).string(order.orderNumber);
        ws.cell(row + 2, 2).string(
          moment(order.createdAt).format("YYYY-MM-DD")
        );
        ws.cell(row + 2, 3).number(order.subtotal);
        ws.cell(row + 2, 4).number(order.offerDiscount);
        ws.cell(row + 2, 5).number(order.couponDiscount);
        ws.cell(row + 2, 6).number(order.orderAmount);
      });

      // Summary
      const summaryStartRow = processedOrders.length + 3;
      ws.cell(summaryStartRow, 1).string("Summary");
      ws.cell(summaryStartRow + 1, 1).string("Total Orders");
      ws.cell(summaryStartRow + 1, 2).number(summary.totalOrders);
      ws.cell(summaryStartRow + 2, 1).string("Overall Subtotal");
      ws.cell(summaryStartRow + 2, 2).number(summary.overallSubtotal);
      ws.cell(summaryStartRow + 3, 1).string("Overall Offer Discount");
      ws.cell(summaryStartRow + 3, 2).number(summary.overallOfferDiscount);
      ws.cell(summaryStartRow + 4, 1).string("Overall Coupon Discount");
      ws.cell(summaryStartRow + 4, 2).number(summary.overallCouponDiscount);
      ws.cell(summaryStartRow + 5, 1).string("Overall Sales Amount");
      ws.cell(summaryStartRow + 5, 2).number(summary.overallOrderAmount);

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${period}-sales-report.xlsx"`
      );
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      wb.writeToBuffer().then((buffer) => res.send(buffer));
    } else {
      // Render EJS
      res.render(`${period}Report`, {
        orders: processedOrders,
        summary,
        filter,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};

// Controllers
const dailyReport = (req, res) => generateReport(req, res, "daily");
const weeklyReport = (req, res) => generateReport(req, res, "weekly");
const monthlyReport = (req, res) => generateReport(req, res, "monthly");
const yearlyReport = (req, res) => generateReport(req, res, "yearly");

module.exports = {
  loadDashboard,
  loadLogin,
  login,
  logout,
  dailyReport,
  weeklyReport,
  monthlyReport,
  yearlyReport,
};
