const Razorpay = require("razorpay");
const razorpay = require("../../config/rozorpay");
const Wallet = require("../../models/walletSchema");
const crypto = require("crypto");

const createOrder = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Please log in to continue" });
    }

    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Please enter a valid amount" });
    }

    const options = {
      amount: amount,
      currency: "INR",
      receipt: `wallet-${Date.now()}`,
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount,
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.TEST_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: "Invalid signature" });
    }

    const wallet = await Wallet.findOne({ userId: req.session.userId });

    if (!wallet) {
      const newWallet = new Wallet({
        userId: req.session.userId,
        balance: Number(amount),
        transaction: [
          {
            amount: Number(amount),
            transactionsMethod: "Razorpay",
            date: new Date(),
          },
        ],
      });

      await newWallet.save();
    } else {
      wallet.balance += Number(amount);
      wallet.transaction.push({
        amount: Number(amount),
        transactionsMethod: "Razorpay",
        date: new Date(),
      });

      await wallet.save();
    }

    res.json({
      success: true,
      message: "Payment verified and wallet updated successfully",
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
};
const transactionHistory = async (req, res) => {
  try {
    const userId = req.session.userId || req.user?._id;

    if (!userId) {
      return res.status(401).render("error", {
        message: "Please log in to view transactions",
        status: 401,
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    const wallet = await Wallet.findOne({ userId })
      .populate({
        path: "transaction.orderId",
        select: "orderNumber",
      })
      .lean();

    if (!wallet || !wallet.transaction || wallet.transaction.length === 0) {
      return res.render("user/transactions", {
        wallet: { transaction: [] },
        user: req.user || {},
        currentPage: 1,
        totalPages: 1,
      });
    }

    wallet.transaction.sort((a, b) => new Date(b.date) - new Date(a.date));

    const totalTransactions = wallet.transaction.length;
    const totalPages = Math.ceil(totalTransactions / limit);

    wallet.transaction = wallet.transaction.slice(skip, skip + limit);

    res.render("transaction", {
      wallet,
      user: req.user || {},
      currentPage: page,
      totalPages: totalPages,
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).render("error", {
      message: "Error fetching transactions",
      status: 500,
    });
  }
};

module.exports = {
  verifyPayment,
  createOrder,
  transactionHistory,
};
