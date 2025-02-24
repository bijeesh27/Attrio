const mongoose=require("mongoose")
const {Schema}=mongoose

const categorySchema= new Schema({
    name:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    status:{
        type:Boolean,
        required:true,
        default:true
    }
});

const Category=mongoose.model("categories",categorySchema)
module.exports=Category