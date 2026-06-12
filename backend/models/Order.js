const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  itemType: { type: String, enum: ['pizza', 'custom'], required: true },
  pizza: { type: mongoose.Schema.Types.ObjectId, ref: 'Pizza' },

  name: { type: String, required: true },
  image: { type: String, default: '' },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true },
  totalPrice: { type: Number, required: true },

  customDetails: {
    base: String,
    sauce: String,
    cheese: String,
    veggies: [String],
    meats: [String],
  },
}, { _id: true });

const statusHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  note: { type: String, default: '' },
}, { _id: false });

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [orderItemSchema],

    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 40 },
    taxes: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },

    deliveryAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
    },

    orderStatus: {
      type: String,
      enum: ['order_received', 'in_kitchen', 'out_for_delivery', 'delivered', 'cancelled'],
      default: 'order_received',
    },
    statusHistory: [statusHistorySchema],

    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['razorpay', 'cod'],
      default: 'razorpay',
    },

    invoiceUrl: { type: String, default: '' },
    notes: { type: String, default: '' },

    estimatedDelivery: { type: Date },
    deliveredAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

orderSchema.pre('save', function (next) {
  if (!this.orderId) {
    const date = new Date();
    const datePart = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const random = Math.floor(1000 + Math.random() * 9000);
    this.orderId = `PZH-${datePart}-${random}`;
  }
  next();
});

orderSchema.index({ user: 1, createdAt: -1 });

orderSchema.index({ orderStatus: 1 });
orderSchema.index({ paymentStatus: 1 });

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
