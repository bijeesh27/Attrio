const Cart=require("../../models/cartSchema");
const Product = require("../../models/productSchema");

const loadCart=async (req,res) => {
    try {
        
        const cart= await Cart.findOne({userId:req.session.userId}).populate("item.productId","name image")
        console.log("cart",cart);
        return res.render('cart',{cart})
    } catch (error) {
        console.log(error);
    }
}

const addToCart=async (req,res) => {
    try {
       console.log("cart Req,body",req.body);

       const userId=req.session.userId

       const {productId,quantity,size}=req.body
       const product=await Product.findOne({_id:productId})
       const total=quantity*product.price
        

       const item={
        productId,
        quantity,
        size,
        price:product.price,
        stock:product.totalstock,
        total
       }

       const existingCart=await Cart.findOne({userId:req.session.userId})
       if(existingCart){
        existingCart.item.push(item)
        existingCart.cartTotal = existingCart.item.reduce((acc, curr) => acc + curr.total, 0);
        await existingCart.save()
       }else{
        const newCart=new Cart({
            userId,
            item:[item],
            cartTotal:total
           })
           await newCart.save()
       }
       

res.redirect("/cart")
    } catch (error) {
        console.log(error);
    }
}

const clearCart=async (req,res) => {
    try {
        await Cart.deleteMany({userId:req.session.userId})
        res.redirect('/cart')
    } catch (error) {
        console.log(error);
    }
}

const removeItem=async (req,res) => {
    try {
        const productId=req.params.productId
        const size=req.params.size
        const userId=req.session.userId

        await Cart.updateOne(
            { "item.productId": productId, "item.size": size },
            { $pull: { item: { productId: productId, size: size } } }
          )

          const cart = await Cart.findOne({ userId });
        
        // Calculate new total based on remaining items
        let cartTotal = 0;
        if (cart && cart.item && cart.item.length > 0) {
            cartTotal = cart.item.reduce((total, item) => {
                return total + (item.price * item.quantity);
            }, 0);
        }
        
        // Update the cart with new total
        await Cart.updateOne(
            { userId },
            { $set: { cartTotal: cartTotal } }
        );


        console.log(productId);
        console.log(size);
res.redirect('/cart')
    } catch (error) {
        console.log(error);
    }
}

module.exports={
    loadCart,
    addToCart,
    clearCart,
    removeItem
}