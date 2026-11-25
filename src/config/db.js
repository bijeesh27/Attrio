const mongoose = require("mongoose");
require("dotenv").config();

let isConnected = false;

const connectDB = async () => {
    if (isConnected || mongoose.connection.readyState >= 1) {
        return;
    }
    if (!process.env.MONGODB_URL) {
        console.warn("MONGODB_URL environment variable is not defined!");
        return;
    }
    try {
        await mongoose.connect(process.env.MONGODB_URL, {
            serverSelectionTimeoutMS: 5000,
        });
        isConnected = true;
        console.log("DataBase connected successfully");
    } catch (error) {
        console.error("Error occurred while connecting database:", error.message);
        throw error;
    }
};

module.exports = connectDB;