const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const Orders=require('../../models/orderSchema')
const bcrypt = require("bcrypt");

const loadDashboard = async (req, res) => {
  try {
    // Get overall order statistics
    const totalOrders = await Orders.countDocuments();
    
    // Get revenue statistics
    const revenueStats = await Orders.aggregate([
      {
        $match: { 
          paymentStatus: 'Completed',
          orderStatus: { $ne: 'Cancelled' }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$orderAmount' },
          averageOrderValue: { $avg: '$orderAmount' }
        }
      }
    ]);
    
    // Get monthly order statistics for the chart
    const currentYear = new Date().getFullYear();
    const monthlyOrders = await Orders.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(`${currentYear}-01-01`),
            $lte: new Date(`${currentYear}-12-31`)
          }
        }
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          count: { $sum: 1 },
          revenue: { $sum: '$orderAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Get recent orders
    const recentOrders = await Orders.find()
      .populate('userId', 'name email')
      .populate('orderedItem.productId', 'name images')
      .sort({ createdAt: -1 })
      .limit(10);
    
    // Get orders by status
    const ordersByStatus = await Orders.aggregate([
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Calculate percentages for the donut chart
    const totalOrderCount = ordersByStatus.reduce((sum, status) => sum + status.count, 0);
    const statusPercentages = ordersByStatus.map(status => ({
      status: status._id,
      percentage: Math.round((status.count / totalOrderCount) * 100)
    }));
    
    // Format data for monthly chart
    const monthlyData = Array(12).fill(0).map((_, i) => {
      const monthData = monthlyOrders.find(m => m._id === i + 1);
      return {
        month: new Date(0, i).toLocaleString('default', { month: 'short' }),
        orders: monthData ? monthData.count : 0,
        revenue: monthData ? monthData.revenue : 0
      };
    });
    
    // Get top selling products
    const topProducts = await Orders.aggregate([
      { $unwind: '$orderedItem' },
      {
        $group: {
          _id: '$orderedItem.productId',
          totalQuantity: { $sum: '$orderedItem.quantity' },
          totalRevenue: { $sum: '$orderedItem.totalProductPrice' }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 3 },
      {
        $lookup: {
          from: 'products', // Name of your products collection
          localField: '_id',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      {
        $project: {
          name: { $arrayElemAt: ['$productDetails.name', 0] },
          description: { $arrayElemAt: ['$productDetails.description', 0] },
          totalQuantity: 1,
          totalRevenue: 1,
          salesPercentage: { $multiply: [{ $divide: ['$totalQuantity', 100] }, 100] } // This will be adjusted later
        }
      }
    ]);
    
    // Calculate total quantity for percentage
    const totalQuantity = topProducts.reduce((sum, product) => sum + product.totalQuantity, 0);
    topProducts.forEach(product => {
      product.salesPercentage = Math.round((product.totalQuantity / totalQuantity) * 100);
    });
    
    // Get tasks (placeholder for demo)
    const tasks = [
      { id: 1, title: 'Update product catalog', assignedTo: 'Mark', completed: false },
      { id: 2, title: 'Process pending orders', assignedTo: 'Team A', completed: false },
      { id: 3, title: 'Resolve customer complaints', assignedTo: 'Janis', completed: false },
      { id: 4, title: 'Update website banners', assignedTo: 'Dianna', completed: false },
      { id: 5, title: 'Prepare monthly report', assignedTo: 'Team B', completed: false }
    ];
    
    // Render the dashboard with all the data
    res.render('dashboard', {
      totalOrders,
      revenue: revenueStats[0]?.totalRevenue || 0,
      averageOrderValue: revenueStats[0]?.averageOrderValue || 0,
      monthlyData,
      statusPercentages,
      topProducts,
      recentOrders,
      tasks
    });
    
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).send('Error loading dashboard');
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

module.exports = {
  loadDashboard,
  loadLogin,
  login,
  logout,
};
