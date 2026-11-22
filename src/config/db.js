const mongoose = require("mongoose");
require("dotenv").config();

let isConnected = false;

const connectDB = async () => {
    if (isConnected || mongoose.connection.readyState >= 1) {
        return;
    }
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        isConnected = true;
        console.log("DataBase connected successfully");
    } catch (error) {
        console.log("error occured while connecting database", error);
    }
};

module.exports = connectDB;