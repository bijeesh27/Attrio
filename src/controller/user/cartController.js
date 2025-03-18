const Cart = require("../../models/cartSchema");
const Product = require("../../models/productSchema");

const loadCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.session.userId }).populate("item.productId", "name image");
        
        return res.render('cart', { cart });
    } catch (error) {
        console.log(error);
    }
};

const addToCart = async (req, res) => {
    try {
        

        const userId = req.session.userId;
        const { productId, quantity, size } = req.body;
        const product = await Product.findOne({ _id: productId, status: true });
        const total = quantity * product.price;

        const existingCart = await Cart.findOne({ userId: userId });

        if (existingCart) {
            // Check if this product with same size already exists in cart
            const existingItemIndex = existingCart.item.findIndex(
                item => item.productId.toString() === productId && item.size === size
            );

            if (existingItemIndex !== -1) {
                // Product with same size exists, update quantity
                existingCart.item[existingItemIndex].quantity = quantity;
                existingCart.item[existingItemIndex].total = quantity * product.price;
            } else {
                // Product doesn't exist in cart, add new item
                const item = {
                    productId,
                    quantity,
                    size,
                    price: product.price,
                    stock: product.totalstock,
                    total
                };
                existingCart.item.push(item);
            }

            // Recalculate cart total
            existingCart.cartTotal = existingCart.item.reduce((acc, curr) => acc + curr.total, 0);
            await existingCart.save();
        } else {
            // Create new cart if no cart exists
            const item = {
                productId,
                quantity,
                size,
                price: product.price,
                stock: product.totalstock,
                total
            };

            const newCart = new Cart({
                userId,
                item: [item],
                cartTotal: total
            });
            await newCart.save();
        }
        const cart=await Cart.findOne({userId:req.session.userId})
        req.session.cartItem=cart?.item.length
        res.redirect("/cart");
    } catch (error) {
        console.log(error);
        res.status(500).send("An error occurred");
    }
};

const updateCartQuantity = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { productId, quantity, size } = req.body;

        // Validate inputs
        if (!productId || !quantity || !size || quantity < 1) {
            return res.status(400).json({
                success: false,
                message: 'Invalid quantity or missing information'
            });
        }

        // Find the product to get current price and check stock
        const product = await Product.findOne({ _id: productId, status: true });
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Check if quantity is valid
        if (quantity > product.totalstock) {
            return res.status(400).json({
                success: false,
                message: 'Requested quantity exceeds available stock'
            });
        }

        // Find and update the cart
        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        // Find the specific item in the cart
        const itemIndex = cart.item.findIndex(
            item => item.productId.toString() === productId && item.size === size
        );

        if (itemIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Item not found in cart'
            });
        }

        // Update quantity and total for this item
        cart.item[itemIndex].quantity = quantity;
        cart.item[itemIndex].total = quantity * product.price;

        // Recalculate cart total
        cart.cartTotal = cart.item.reduce((acc, curr) => acc + curr.total, 0);

        // Save the updated cart
        await cart.save();

        // Return updated values for the UI
        res.json({
            success: true,
            itemTotal: cart.item[itemIndex].total,
            cartTotal: cart.cartTotal
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while updating the cart'
        });
    }
};

const clearCart = async (req, res) => {
    try {
        await Cart.deleteMany({ userId: req.session.userId });
        res.redirect('/cart');
    } catch (error) {
        console.log(error);
    }
};

const removeItem = async (req, res) => {
    try {
        const productId = req.params.productId;
        const size = req.params.size;
        const userId = req.session.userId;

        await Cart.updateOne(
            { "item.productId": productId, "item.size": size },
            { $pull: { item: { productId: productId, size: size } } }
        );

        const cart = await Cart.findOne({ userId });

        
        let cartTotal = 0;
        if (cart && cart.item && cart.item.length > 0) {
            cartTotal = cart.item.reduce((total, item) => {
                return total + (item.price * item.quantity);
            }, 0);
        }

        
        await Cart.updateOne(
            { userId },
            { $set: { cartTotal: cartTotal } }
        );

        res.json({ success: true });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'An error occurred' });
    }
};

module.exports = {
    loadCart,
    addToCart,
    clearCart,
    removeItem,
    updateCartQuantity
};