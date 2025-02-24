const mongoose=require('mongoose')
const {Schema}=mongoose;


var productSchema = new Schema({
    name: {
      type: String,
      required: true
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'categories',
      required: true,
    },
    description: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    stock: [{
      size: {
        type: String,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
    }],
    totalstock: {
      type: Number,
      required: true,
    },
    image: {
      type: Array,
      required: true,
    },
    status: {
      type: Boolean,
      default: true,
    }
  });

  const Product=mongoose.model("Product",productSchema)
  module.exports=Product