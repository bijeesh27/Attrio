const mongoose = require("mongoose");
const {Schema} = mongoose;


var addressSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    address: [{
        name: {
            type: String,
            required: true
        },
        email:{
            type:String,
            required:true
        },
        number:{
            type:Number,
            required : true
        },
        houseName: {
            type: String,
            required: true
          },
          street: {
            type: String,
            required: true
          },
          city: {
            type: String,
            required: true
          },
          state: {
            type: String,
            required: true
          },
          country: {
            type: String,
            required: true
          },
          pincode: {
            type: String,
            required: true
          },
          saveAs: {
            type: String,
            required: true,
            enum: ["Home", "Work", "Other"]
          },
          isDefault: {
            type: Boolean,
            default: false,
          }
    }]
});



const Address = mongoose.model("Address",addressSchema);


module.exports = Address;