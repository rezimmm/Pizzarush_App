/**
 * models/Inventory.js — Inventory Schema
 * Tracks stock for pizza bases, sauces, cheeses, veggies, and meats.
 */

const mongoose = require('mongoose');

const inventoryLogSchema = new mongoose.Schema({
  action: {
    type: String,
    enum: ['add', 'deduct', 'adjust'],
    required: true,
  },
  quantity: { type: Number, required: true },
  reason: { type: String, default: '' },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  timestamp: { type: Date, default: Date.now },
});

const inventorySchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: ['base', 'sauce', 'cheese', 'veggie', 'meat'],
      required: [true, 'Category is required'],
    },
    itemName: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative'],
      default: 0,
    },
    threshold: {
      type: Number,
      required: [true, 'Threshold is required'],
      min: [1, 'Threshold must be at least 1'],
      default: 10,
    },
    unit: {
      type: String,
      default: 'units',
    },
    price: {
      type: Number,
      default: 0,
      min: 0,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    imageUrl: {
      type: String,
      default: '',
    },
    logs: [inventoryLogSchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Virtual: isLowStock ──────────────────────────────────────────────────────
inventorySchema.virtual('isLowStock').get(function () {
  return this.quantity <= this.threshold;
});

// ─── Virtual: isOutOfStock ────────────────────────────────────────────────────
inventorySchema.virtual('isOutOfStock').get(function () {
  return this.quantity <= 0;
});

// ─── Index ────────────────────────────────────────────────────────────────────
inventorySchema.index({ category: 1, isAvailable: 1 });
inventorySchema.index({ itemName: 1 });

// ─── Middleware: Auto-set isAvailable based on quantity ───────────────────────
inventorySchema.pre('save', function (next) {
  this.isAvailable = this.quantity > 0;
  next();
});

const Inventory = mongoose.model('Inventory', inventorySchema);
module.exports = Inventory;
