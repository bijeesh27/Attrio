const mongoose=require("mongoose")
require("dotenv").config()


const connectDB=async ()=>{
    try {
        await mongoose.connect(process.env.MONGODB_URL)
        console.log("DataBase conected successfully");
    } catch (error) {
        console.log("error occured while connectiong database",error);
    }
}

module.exports = connectDB