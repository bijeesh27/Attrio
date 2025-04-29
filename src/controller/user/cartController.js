const Cart = require("../../models/cartSchema");
const Product = require("../../models/productSchema");
const Offer = require("../../models/offerSchema");
const User = require("../../models/userSchema"); // Added missing User model import

/**
 * Validates if requested product quantity is available in stock
 * @param {Object} product - Product document
 * @param {String} size - Product size
 * @param {Number} requestedQty - Requested quantity
 * @returns {Object} - Validation result with success status and message
 */
const validateStockAvailability = (product, size, requestedQty) => {
  // First check if product exists and is active
  if (!product || !product.status) {
    return {
      success: false,
      message: "Product not found or unavailable"
    };
  }

  // Find stock entry for specific size
  const stockEntry = product.stock.find(stock => stock.size === size);
  
  // Check if size exists in product stock
  if (!stockEntry) {
    return {
      success: false,
      outOfStock: true,
      message: `Size ${size} is not available for this product`
    };
  }
  
  // Check if requested quantity is available
  if (stockEntry.quantity < requestedQty) {
    return {
      success: false,
      outOfStock: true,
      message: `Only ${stockEntry.quantity} items available for size ${size}`
    };
  }
  
  return {
    success: true,
    message: "Stock available",
    availableQty: stockEntry.quantity
  };
};

const loadCart = async (req, res) => {
  try {
    console.log("entering the cart controller rendering the cart page");

    const cart = await Cart.findOne({ userId: req.session.userId }).populate({
      path: "item.productId",
      select: "name image stock price category",
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

    // Update stock availability for each item
    for (let item of cart.item) {
      const product = item.productId;
      
      // Validate current stock levels for each item in cart
      if (product) {
        const stockEntry = product.stock.find(stock => stock.size === item.size);
        item.inStock = stockEntry && stockEntry.quantity >= item.quantity;
        item.availableStock = stockEntry ? stockEntry.quantity : 0;
      }
      
      // Find applicable offer for the product
      let applicableOffer = null;
      applicableOffer = offers.find((offer) => {
        const isProductOffer =
          offer.offerType === "product" &&
          offer.productId &&
          offer.productId.length > 0 &&
          product &&
          product._id &&
          offer.productId.some(
            (id) => id && id.toString() === product._id.toString()
          );

        const isCategoryOffer =
          offer.offerType === "category" &&
          offer.categoryId &&
          offer.categoryId.length > 0 &&
          product &&
          product.category &&
          offer.categoryId.some(
            (id) => id && id.toString() === product.category.toString()
          );

        return isProductOffer || isCategoryOffer;
      });

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

    cart.cartTotal = cart.item.reduce((sum, item) => sum + item.total, 0);
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
    console.log("entering the addToCart");
    const userId = req.session.userId;
    console.log("userID:", userId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        login_required: true,
        message: "Please login to add items to your cart",
      });
    }

    const { productId, quantity, size } = req.body;
    if (!productId || !quantity || !size || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields or invalid quantity",
      });
    }

    const product = await Product.findOne({ _id: productId, status: true });
    
    // Validate stock availability
    const stockValidation = validateStockAvailability(product, size, quantity);
    if (!stockValidation.success) {
      return res.status(400).json(stockValidation);
    }

    const existingCart = await Cart.findOne({ userId: userId });
    const pricePerUnit = product.price;
    const total = quantity * pricePerUnit;

    if (existingCart) {
      const existingItemIndex = existingCart.item.findIndex(
        (item) => item.productId.toString() === productId && item.size === size
      );

      if (existingItemIndex !== -1) {
        // Item exists - validate combined quantity
        const newQuantity = existingCart.item[existingItemIndex].quantity + parseInt(quantity);
        const combinedStockValidation = validateStockAvailability(product, size, newQuantity);
        
        if (!combinedStockValidation.success) {
          return res.status(400).json(combinedStockValidation);
        }

        existingCart.item[existingItemIndex].quantity = newQuantity;
        existingCart.item[existingItemIndex].total = newQuantity * pricePerUnit;
        existingCart.item[existingItemIndex].stock = stockValidation.availableQty;
      } else {
        // New item - add to cart
        const item = {
          productId,
          quantity: parseInt(quantity),
          size,
          price: pricePerUnit,
          stock: stockValidation.availableQty,
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
      // Create new cart
      const item = {
        productId,
        quantity: parseInt(quantity),
        size,
        price: pricePerUnit,
        stock: stockValidation.availableQty,
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
    req.session.cartItem = cart?.item.length || 0;
    
    return res.json({
      success: true,
      message: "Product added to cart successfully",
      cartCount: cart?.item.length || 0
    });
  } catch (error) {
    console.error("Add to cart error:", error);
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

    const { productId, quantity, size, fromWishlist } = req.body;

    if (!productId || !quantity || !size || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields or invalid quantity",
      });
    }

    const product = await Product.findOne({ _id: productId, status: true });
    
    // Validate stock availability
    const stockValidation = validateStockAvailability(product, size, quantity);
    if (!stockValidation.success) {
      return res.status(400).json(stockValidation);
    }

    const existingCart = await Cart.findOne({ userId: userId });
    const pricePerUnit = product.price;
    const total = quantity * pricePerUnit;

    if (existingCart) {
      const existingItemIndex = existingCart.item.findIndex(
        (item) => item.productId.toString() === productId && item.size === size
      );

      if (existingItemIndex !== -1) {
        // Item exists - validate combined quantity
        const newQuantity = existingCart.item[existingItemIndex].quantity + parseInt(quantity);
        const combinedStockValidation = validateStockAvailability(product, size, newQuantity);
        
        if (!combinedStockValidation.success) {
          return res.status(400).json(combinedStockValidation);
        }

        existingCart.item[existingItemIndex].quantity = newQuantity;
        existingCart.item[existingItemIndex].total = newQuantity * pricePerUnit;
        existingCart.item[existingItemIndex].stock = stockValidation.availableQty;
      } else {
        // New item - add to cart
        const item = {
          productId,
          quantity: parseInt(quantity),
          size,
          price: pricePerUnit,
          stock: stockValidation.availableQty,
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
      // Create new cart
      const item = {
        productId,
        quantity: parseInt(quantity),
        size,
        price: pricePerUnit,
        stock: stockValidation.availableQty,
        total,
      };

      const newCart = new Cart({
        userId,
        item: [item],
        cartTotal: total,
      });
      await newCart.save();
    }

    // Handle wishlist removal if item came from wishlist
    if (fromWishlist) {
      await User.updateOne(
        { _id: userId },
        { $pull: { wishlist: { productId: productId } } }
      );
    }

    const cart = await Cart.findOne({ userId: req.session.userId });
    if (cart) {
      req.session.cartItem = cart.item.length;
    }

    return res.status(200).json({
      success: true,
      message: "Item added to cart successfully",
      cartCount: cart?.item.length || 0,
      wishlistUpdated: fromWishlist ? true : false,
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
    const { productId, quantity, size, offerPrice } = req.body;

    if (!productId || !quantity || !size || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid quantity or missing information",
      });
    }

    const product = await Product.findOne({ _id: productId, status: true });
    
    // Validate stock availability using the helper function
    const stockValidation = validateStockAvailability(product, size, quantity);
    if (!stockValidation.success) {
      return res.status(400).json(stockValidation);
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    const itemIndex = cart.item.findIndex(
      (item) => item.productId.toString() === productId && item.size === size
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart",
      });
    }

    // Update quantity, stock info, and total
    cart.item[itemIndex].quantity = parseInt(quantity);
    cart.item[itemIndex].stock = stockValidation.availableQty;
    cart.item[itemIndex].total = quantity * (offerPrice || product.price);
    cart.cartTotal = cart.item.reduce((acc, curr) => acc + curr.total, 0);
    
    await cart.save();

    res.json({
      success: true,
      itemTotal: cart.item[itemIndex].total,
      cartTotal: cart.cartTotal,
      availableStock: stockValidation.availableQty
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
    req.session.cartItem = 0;
    res.redirect("/cart");
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
};

const removeItem = async (req, res) => {
  try {
    const productId = req.params.productId;
    const size = req.params.size;
    const userId = req.session.userId;

    // Remove specific item from cart
    const result = await Cart.updateOne(
      { userId },
      { $pull: { item: { productId: productId, size: size } } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Item not found in cart" 
      });
    }

    // Recalculate cart total
    const cart = await Cart.findOne({ userId });
    let cartTotal = 0;
    
    if (cart && cart.item && cart.item.length > 0) {
      cartTotal = cart.item.reduce((total, item) => {
        return total + (item.offerPrice || item.price) * item.quantity;
      }, 0);
      
      await Cart.updateOne({ userId }, { $set: { cartTotal: cartTotal } });
      req.session.cartItem = cart.item.length;
    } else {
      // If cart is empty after removing item
      req.session.cartItem = 0;
    }

    res.json({ 
      success: true, 
      cartTotal: cartTotal,
      cartCount: cart?.item.length || 0
    });
  } catch (error) {
    console.error("Remove item error:", error);
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