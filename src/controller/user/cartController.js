const Cart = require("../../models/cartSchema");
const Product = require("../../models/productSchema");

const Offer = require('../../models/offerSchema'); // Adjust path
const loadCart = async (req, res) => {
  try {
    console.log("entering the cart controller rendering the cart page");

    const cart = await Cart.findOne({ userId: req.session.userId }).populate({
      path: "item.productId",
      select: "name image stock price category", // Ensure category is populated
    });

    if (!cart || !cart.item.length) {
      return res.render("cart", { cart: null });
    }

    const currentDate = new Date();
    const offers = await Offer.find({
      status: true,
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate },
    });

    // Update each item's total and offer price
    for (let item of cart.item) {
      const product = item.productId;
      let applicableOffer = null;

      // Find applicable offer with more robust checking
      applicableOffer = offers.find(offer => {
        // Check for product-specific offer
        const isProductOffer = 
          offer.offerType === 'product' && 
          offer.productId &&
          offer.productId.length > 0 &&
          product &&
          product._id &&
          offer.productId.some(id => 
            id && id.toString() === product._id.toString()
          );

        // Check for category offer
        const isCategoryOffer = 
          offer.offerType === 'category' && 
          offer.categoryId &&
          offer.categoryId.length > 0 &&
          product &&
          product.category &&
          offer.categoryId.some(id => 
            id && id.toString() === product.category.toString()
          );

        return isProductOffer || isCategoryOffer;
      });

      // Calculate pricing
      if (applicableOffer) {
        item.offer_id = applicableOffer._id;
        const discountAmount = (item.price * applicableOffer.discount) / 100;
        item.offerPrice = item.price - discountAmount;
        item.total = item.offerPrice * item.quantity;
      } else {
        item.offerPrice = null;
        item.total = item.price * item.quantity;
      }
    }

    // Recalculate cart total
    cart.cartTotal = cart.item.reduce((sum, item) => sum + item.total, 0);

    // Save the updated cart
    await cart.save();

    console.log("Cart:", cart);
    return res.render("cart", { cart });
  } catch (error) {
    console.error("Error in loadCart:", error);
    return res.status(500).send("Server Error");
  }
};
const addToCart = async (req, res) => {
  try {
    console.log("entering the aDDtocart");
    const userId = req.session.userId;
    console.log("userIDDDDD:",userId);

    // Check if user is logged in
    if (!userId) {
      return res.status(401).json({
        success: false,
        login_required: true,
        message: "Please login to add items to your cart"
      });
    }

    const { productId, quantity, size } = req.body;
    const product = await Product.findOne({ _id: productId, status: true });
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    const total = quantity * product.price;
    const existingCart = await Cart.findOne({ userId: userId });

    if (existingCart) {
      const existingItemIndex = existingCart.item.findIndex(
        (item) => item.productId.toString() === productId && item.size === size
      );

      if (existingItemIndex !== -1) {
        existingCart.item[existingItemIndex].quantity += quantity;
        existingCart.item[existingItemIndex].total = 
          existingCart.item[existingItemIndex].quantity * product.price;
      } else {
        const item = {
          productId,
          quantity,
          size,
          price: product.price,
          stock: product.totalstock,
          total,
        };
        existingCart.item.push(item);
      }

      existingCart.cartTotal = existingCart.item.reduce(
        (acc, curr) => acc + curr.total,
        0
      );
      await existingCart.save();
    } else {
      const item = {
        productId,
        quantity,
        size,
        price: product.price,
        stock: product.totalstock,
        total,
      };

      const newCart = new Cart({
        userId,
        item: [item],
        cartTotal: total,
      });
      await newCart.save();
    }

    const cart = await Cart.findOne({ userId: req.session.userId });
    req.session.cartItem = cart?.item.length;
    res.json({
      success: true,
      message: "Product added to cart successfully"
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "An error occurred",
    });
  }
};

const addTOcart = async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        login_required: true,
        message: "User not logged in",
      });
    }

    const { productId, quantity, size } = req.body;

    // Validate inputs
    if (!productId || !quantity || !size) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Find the product and check if it exists and is active
    const product = await Product.findOne({ _id: productId, status: true });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or unavailable",
      });
    }

    // Check stock availability for the specific size
    const stockEntry = product.stock.find((stock) => stock.size === size);
    if (!stockEntry || stockEntry.quantity < quantity) {
      return res.status(400).json({
        success: false,
        outOfStock: true,
        message: `Size ${size} is out of stock or insufficient quantity available`,
      });
    }

    const total = quantity * product.price;
    const existingCart = await Cart.findOne({ userId: userId });

    if (existingCart) {
      // Check if this product with the same size already exists in the cart
      const existingItemIndex = existingCart.item.findIndex(
        (item) => item.productId.toString() === productId && item.size === size
      );

      if (existingItemIndex !== -1) {
        // Product with the same size exists, update quantity
        const newQuantity = existingCart.item[existingItemIndex].quantity + quantity;
        if (newQuantity > stockEntry.quantity) {
          return res.status(400).json({
            success: false,
            outOfStock: true,
            message: `Requested quantity for size ${size} exceeds available stock`,
          });
        }
        existingCart.item[existingItemIndex].quantity = newQuantity;
        existingCart.item[existingItemIndex].total = newQuantity * product.price;
      } else {
        // Product doesn't exist in cart, add new item
        const item = {
          productId,
          quantity,
          size,
          price: product.price,
          stock: stockEntry.quantity, // Store the available stock for this size
          total,
        };
        existingCart.item.push(item);
      }

      // Recalculate cart total
      existingCart.cartTotal = existingCart.item.reduce(
        (acc, curr) => acc + curr.total,
        0
      );
      await existingCart.save();
    } else {
      // Create new cart if no cart exists
      const item = {
        productId,
        quantity,
        size,
        price: product.price,
        stock: stockEntry.quantity, // Store the available stock for this size
        total,
      };

      const newCart = new Cart({
        userId,
        item: [item],
        cartTotal: total,
      });
      await newCart.save();
    }

    const cart = await Cart.findOne({ userId: req.session.userId });
    if (cart) {
      req.session.cartItem = cart.item.length;
    }

    // Send JSON response
    return res.status(200).json({
      success: true,
      message: "Item added to cart successfully",
      cartCount: cart?.item.length || 0,
    });
  } catch (error) {
    console.error("Add to cart error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while adding item to cart",
    });
  }
};

const updateCartQuantity = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { productId, quantity, size,offerPrice } = req.body;

    // Validate inputs
    if (!productId || !quantity || !size || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid quantity or missing information",
      });
    }

    // Find the product to get current price and check stock
    const product = await Product.findOne({ _id: productId, status: true });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check if quantity is valid
    if (quantity > product.totalstock) {
      return res.status(400).json({
        success: false,
        message: "Requested quantity exceeds available stock",
      });
    }

    // Find and update the cart
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    // Find the specific item in the cart
    const itemIndex = cart.item.findIndex(
      (item) => item.productId.toString() === productId && item.size === size
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart",
      });
    }

    const stockEntry = product.stock.find((stock) => stock.size === size); 
    if (!stockEntry || quantity > stockEntry.quantity) {
      return res.status(422).json({
        success: false,
        message: "Requested quantity exceeds available stock",
        value:stockEntry
      });
    }

    // Update quantity and total for this item
    cart.item[itemIndex].quantity = quantity;
    cart.item[itemIndex].total = quantity *(offerPrice|| product.price);

    // Recalculate cart total
    cart.cartTotal = cart.item.reduce((acc, curr) => acc + curr.total, 0);

    // Save the updated cart
    await cart.save();

    // Return updated values for the UI
    res.json({
      success: true,
      itemTotal: cart.item[itemIndex].total,
      cartTotal: cart.cartTotal,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "An error occurred while updating the cart",
    });
  }
};

const clearCart = async (req, res) => {
  try {
    await Cart.deleteMany({ userId: req.session.userId });
    res.redirect("/cart");
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
        return total + item.price * item.quantity;
      }, 0);
    }

    await Cart.updateOne({ userId }, { $set: { cartTotal: cartTotal } });

    res.json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "An error occurred" });
  }
};

module.exports = {
  loadCart,
  addToCart,
  clearCart,
  removeItem,
  updateCartQuantity,
  addTOcart,
};
