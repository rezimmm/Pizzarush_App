const Cart = require('../models/Cart');
const Pizza = require('../models/Pizza');
const Inventory = require('../models/Inventory');
const { ApiResponse, AppError } = require('../utils/apiResponse');

const calculateCustomPrice = (baseDetails, sauceDetails, cheeseDetails, veggiesDetails, meatsDetails) => {
  const BASE_PRICE = 149;
  const basePrice = baseDetails?.price || 0;
  const saucePrice = sauceDetails?.price || 0;
  const cheesePrice = cheeseDetails?.price || 0;
  const veggiesPrice = (veggiesDetails || []).reduce((sum, v) => sum + (v.price || 0), 0);
  const meatsPrice = (meatsDetails || []).reduce((sum, m) => sum + (m.price || 0), 0);
  return BASE_PRICE + basePrice + saucePrice + cheesePrice + veggiesPrice + meatsPrice;
};

const getCart = async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id })
    .populate('items.pizza', 'name price image isAvailable')
    .populate('items.customPizza.base', 'itemName price category')
    .populate('items.customPizza.sauce', 'itemName price category')
    .populate('items.customPizza.cheese', 'itemName price category')
    .populate('items.customPizza.veggies', 'itemName price category')
    .populate('items.customPizza.meats', 'itemName price category');

  if (!cart) {
    return ApiResponse.success(res, { cart: { items: [], totalAmount: 0 } });
  }

  return ApiResponse.success(res, { cart });
};

const addToCart = async (req, res, next) => {
  const { itemType, pizzaId, customPizza, quantity = 1 } = req.body;

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }

  let newItem;

  if (itemType === 'pizza') {
    const pizza = await Pizza.findById(pizzaId);
    if (!pizza) return next(new AppError('Pizza not found', 404));
    if (!pizza.isAvailable) return next(new AppError('This pizza is currently unavailable', 400));

    const unitPrice = pizza.price;
    newItem = {
      itemType: 'pizza',
      pizza: pizza._id,
      pizzaSnapshot: { name: pizza.name, price: pizza.price, image: pizza.image },
      quantity,
      unitPrice,
      totalPrice: unitPrice * quantity,
    };
  } else if (itemType === 'custom') {
    const { baseId, sauceId, cheeseId, veggieIds = [], meatIds = [] } = customPizza;

    const [base, sauce, cheese] = await Promise.all([
      Inventory.findById(baseId),
      Inventory.findById(sauceId),
      Inventory.findById(cheeseId),
    ]);

    if (!base || !sauce || !cheese) {
      return next(new AppError('Invalid ingredient selection', 400));
    }

    if (!base.isAvailable) return next(new AppError(`${base.itemName} is out of stock`, 400));
    if (!sauce.isAvailable) return next(new AppError(`${sauce.itemName} is out of stock`, 400));
    if (!cheese.isAvailable) return next(new AppError(`${cheese.itemName} is out of stock`, 400));

    const veggies = veggieIds.length ? await Inventory.find({ _id: { $in: veggieIds } }) : [];
    const meats = meatIds.length ? await Inventory.find({ _id: { $in: meatIds } }) : [];

    const baseDetails = { name: base.itemName, price: base.price };
    const sauceDetails = { name: sauce.itemName, price: sauce.price };
    const cheeseDetails = { name: cheese.itemName, price: cheese.price };
    const veggiesDetails = veggies.map((v) => ({ name: v.itemName, price: v.price }));
    const meatsDetails = meats.map((m) => ({ name: m.itemName, price: m.price }));

    const unitPrice = calculateCustomPrice(baseDetails, sauceDetails, cheeseDetails, veggiesDetails, meatsDetails);

    newItem = {
      itemType: 'custom',
      customPizza: {
        base: base._id,
        sauce: sauce._id,
        cheese: cheese._id,
        veggies: veggies.map((v) => v._id),
        meats: meats.map((m) => m._id),
        baseDetails,
        sauceDetails,
        cheeseDetails,
        veggiesDetails,
        meatsDetails,
      },
      quantity,
      unitPrice,
      totalPrice: unitPrice * quantity,
    };
  } else {
    return next(new AppError('Invalid item type', 400));
  }

  cart.items.push(newItem);
  await cart.save();

  return ApiResponse.success(res, { cart }, 'Item added to cart');
};

const updateCartItem = async (req, res, next) => {
  const { quantity } = req.body;

  if (!quantity || quantity < 1) {
    return next(new AppError('Quantity must be at least 1', 400));
  }

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) return next(new AppError('Cart not found', 404));

  const item = cart.items.id(req.params.itemId);
  if (!item) return next(new AppError('Item not found in cart', 404));

  item.quantity = quantity;
  item.totalPrice = item.unitPrice * quantity;

  await cart.save();
  return ApiResponse.success(res, { cart }, 'Cart updated');
};

const removeFromCart = async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) return next(new AppError('Cart not found', 404));

  cart.items = cart.items.filter((item) => item._id.toString() !== req.params.itemId);
  await cart.save();
  return ApiResponse.success(res, { cart }, 'Item removed from cart');
};

const clearCart = async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (cart) {
    cart.items = [];
    await cart.save();
  }
  return ApiResponse.success(res, {}, 'Cart cleared');
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
};
