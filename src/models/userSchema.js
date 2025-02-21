const mongoose=require('mongoose')
const {Schema}=mongoose;

const userSchema = new Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: false
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    number: {
        type: String,
        required: false,
    },
    password: {
        type: String,
        required: false
    },
    status: {
        type: Boolean,
        default: true
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
},{timestamps:true});

const User=mongoose.model("User",userSchema)

module.exports=User