const Razorpay = require('razorpay');
require('dotenv').config();

let razorpay = null;

if (process.env.TEST_KEY_ID && process.env.TEST_KEY_SECRET) {
  try {
    razorpay = new Razorpay({
      key_id: process.env.TEST_KEY_ID,
      key_secret: process.env.TEST_KEY_SECRET
    });
  } catch (err) {
    console.warn("Failed to initialize Razorpay:", err.message);
  }
} else {
  console.warn("Razorpay credentials (TEST_KEY_ID / TEST_KEY_SECRET) are missing. Payment features will be disabled until configured.");
  razorpay = {
    orders: {
      create: async () => { throw new Error("Razorpay is not configured with valid API keys."); }
    },
    payments: {
      fetch: async () => { throw new Error("Razorpay is not configured with valid API keys."); }
    }
  };
}

module.exports = razorpay;
