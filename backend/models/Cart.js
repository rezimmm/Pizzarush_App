const mongoose = require('mongoose');

const customPizzaSchema = new mongoose.Schema({
  base: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true },
  sauce: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true },
  cheese: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true },
  veggies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' }],
  meats: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' }],

  baseDetails: { name: String, price: Number },
  sauceDetails: { name: String, price: Number },
  cheeseDetails: { name: String, price: Number },
  veggiesDetails: [{ name: String, price: Number }],
  meatsDetails: [{ name: String, price: Number }],
}, { _id: false });

const cartItemSchema = new mongoose.Schema({
  itemType: {
    type: String,
    enum: ['pizza', 'custom'],
    required: true,
  },

  pizza: { type: mongoose.Schema.Types.ObjectId, ref: 'Pizza' },
  pizzaSnapshot: {
    name: String,
    price: Number,
    image: String,
  },

  customPizza: customPizzaSchema,

  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
    default: 1,
  },
  unitPrice: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
}, { _id: true });

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    items: [cartItemSchema],
    totalAmount: {
      type: Number,
      default: 0,
    },
    appliedCoupon: {
      code: String,
      discount: Number,
    },
  },
  { timestamps: true }
);

cartSchema.pre('save', function (next) {
  this.totalAmount = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  next();
});

const Cart = mongoose.model('Cart', cartSchema);
module.exports = Cart;
