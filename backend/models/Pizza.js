/**
 * models/Pizza.js — Pizza catalog schema
 * Predefined pizzas available in the menu.
 */

const mongoose = require('mongoose');

const pizzaSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Pizza name is required'],
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    image: {
      type: String,
      default: '',
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    category: {
      type: String,
      enum: ['veg', 'non-veg', 'vegan'],
      required: [true, 'Category is required'],
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    ratings: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },
    tags: [{ type: String }],
    // Ingredients used (for display purposes)
    ingredients: {
      base: { type: String },
      sauce: { type: String },
      cheese: { type: String },
      veggies: [{ type: String }],
      meats: [{ type: String }],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

pizzaSchema.index({ name: 'text', description: 'text' }); // Full-text search
pizzaSchema.index({ category: 1, isAvailable: 1 });
pizzaSchema.index({ price: 1 });

const Pizza = mongoose.model('Pizza', pizzaSchema);
module.exports = Pizza;
