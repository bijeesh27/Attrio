const mongoose = require("mongoose");
const {Schema} = mongoose;


var cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
    item: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref:'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
        },
        size: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true,
        },
        offerPrice: {  
            type: Number,
            default: null
        },
        stock: {
            type: String,
            required: true
        },
        total: {
            type: Number,
            required: true
        },
        offer_id: {
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Offer'
        },
    }],
    total: Number,
    cartTotal: {
        type: Number
    }
},{strictPopulate:false});

const Cart=mongoose.model("Cart",cartSchema)

module.exports=Cart
