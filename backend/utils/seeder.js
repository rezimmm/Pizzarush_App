require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Pizza = require('../models/Pizza');
const Inventory = require('../models/Inventory');
const logger = require('./logger');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ MongoDB connected for seeding');
};

const seedInventory = async () => {
  const items = [

    { category: 'base', itemName: 'Thin Crust', quantity: 100, threshold: 20, price: 0, unit: 'units' },
    { category: 'base', itemName: 'Thick Crust', quantity: 80, threshold: 20, price: 20, unit: 'units' },
    { category: 'base', itemName: 'Cheese Burst', quantity: 60, threshold: 15, price: 40, unit: 'units' },
    { category: 'base', itemName: 'Whole Wheat', quantity: 50, threshold: 15, price: 30, unit: 'units' },
    { category: 'base', itemName: 'Stuffed Crust', quantity: 40, threshold: 10, price: 50, unit: 'units' },

    { category: 'sauce', itemName: 'Tomato Sauce', quantity: 200, threshold: 30, price: 0, unit: 'units' },
    { category: 'sauce', itemName: 'BBQ Sauce', quantity: 150, threshold: 25, price: 15, unit: 'units' },
    { category: 'sauce', itemName: 'White Sauce', quantity: 120, threshold: 20, price: 20, unit: 'units' },
    { category: 'sauce', itemName: 'Garlic Sauce', quantity: 100, threshold: 20, price: 15, unit: 'units' },
    { category: 'sauce', itemName: 'Pesto Sauce', quantity: 80, threshold: 15, price: 25, unit: 'units' },

    { category: 'cheese', itemName: 'Mozzarella', quantity: 200, threshold: 30, price: 0, unit: 'units' },
    { category: 'cheese', itemName: 'Cheddar', quantity: 150, threshold: 25, price: 20, unit: 'units' },
    { category: 'cheese', itemName: 'Parmesan', quantity: 100, threshold: 20, price: 25, unit: 'units' },
    { category: 'cheese', itemName: 'Mix Cheese', quantity: 120, threshold: 20, price: 30, unit: 'units' },
    { category: 'cheese', itemName: 'Vegan Cheese', quantity: 60, threshold: 15, price: 40, unit: 'units' },

    { category: 'veggie', itemName: 'Onion', quantity: 500, threshold: 50, price: 10, unit: 'units' },
    { category: 'veggie', itemName: 'Capsicum', quantity: 400, threshold: 50, price: 15, unit: 'units' },
    { category: 'veggie', itemName: 'Corn', quantity: 300, threshold: 40, price: 15, unit: 'units' },
    { category: 'veggie', itemName: 'Tomato', quantity: 500, threshold: 50, price: 10, unit: 'units' },
    { category: 'veggie', itemName: 'Olive', quantity: 200, threshold: 30, price: 20, unit: 'units' },
    { category: 'veggie', itemName: 'Jalapeno', quantity: 150, threshold: 25, price: 20, unit: 'units' },
    { category: 'veggie', itemName: 'Mushroom', quantity: 200, threshold: 30, price: 20, unit: 'units' },
    { category: 'veggie', itemName: 'Paneer', quantity: 150, threshold: 25, price: 30, unit: 'units' },
    { category: 'veggie', itemName: 'Broccoli', quantity: 100, threshold: 20, price: 25, unit: 'units' },

    { category: 'meat', itemName: 'Chicken', quantity: 200, threshold: 30, price: 40, unit: 'units' },
    { category: 'meat', itemName: 'Pepperoni', quantity: 150, threshold: 25, price: 50, unit: 'units' },
    { category: 'meat', itemName: 'Sausage', quantity: 120, threshold: 20, price: 45, unit: 'units' },
    { category: 'meat', itemName: 'Ham', quantity: 100, threshold: 20, price: 45, unit: 'units' },
  ];

  await Inventory.deleteMany({});
  await Inventory.insertMany(items);
  console.log(`✅ Seeded ${items.length} inventory items`);
};

const seedPizzas = async () => {
  const pizzas = [
    {
      name: 'Margherita Classic',
      description: 'The timeless classic with fresh tomato sauce, premium mozzarella, and fragrant basil.',
      price: 299,
      category: 'veg',
      isFeatured: true,
      isAvailable: true,
      tags: ['classic', 'bestseller'],
      ingredients: { base: 'Thin Crust', sauce: 'Tomato Sauce', cheese: 'Mozzarella', veggies: ['Tomato'], meats: [] },
    },
    {
      name: 'Pepperoni Feast',
      description: 'Loaded with spicy pepperoni slices on a rich tomato base with melted mozzarella.',
      price: 449,
      category: 'non-veg',
      isFeatured: true,
      isAvailable: true,
      tags: ['spicy', 'bestseller', 'meat-lovers'],
      ingredients: { base: 'Thick Crust', sauce: 'Tomato Sauce', cheese: 'Mozzarella', veggies: [], meats: ['Pepperoni'] },
    },
    {
      name: 'BBQ Chicken Deluxe',
      description: 'Smoky BBQ sauce, grilled chicken, caramelized onions, and cheddar on a thick crust.',
      price: 499,
      category: 'non-veg',
      isFeatured: true,
      isAvailable: true,
      tags: ['bbq', 'chicken'],
      ingredients: { base: 'Thick Crust', sauce: 'BBQ Sauce', cheese: 'Cheddar', veggies: ['Onion'], meats: ['Chicken'] },
    },
    {
      name: 'Garden Veggie Supreme',
      description: 'A colorful medley of fresh vegetables on a whole wheat crust with pesto sauce.',
      price: 379,
      category: 'veg',
      isFeatured: false,
      isAvailable: true,
      tags: ['healthy', 'veggie'],
      ingredients: { base: 'Whole Wheat', sauce: 'Pesto Sauce', cheese: 'Mozzarella', veggies: ['Capsicum', 'Mushroom', 'Olive', 'Tomato'], meats: [] },
    },
    {
      name: 'Cheese Burst Extravaganza',
      description: 'Four-cheese explosion with gooey cheese burst crust — cheese lover\'s dream.',
      price: 549,
      category: 'veg',
      isFeatured: true,
      isAvailable: true,
      tags: ['cheese', 'indulgent'],
      ingredients: { base: 'Cheese Burst', sauce: 'White Sauce', cheese: 'Mix Cheese', veggies: [], meats: [] },
    },
    {
      name: 'Spicy Jalapeno Fire',
      description: 'Fiery jalapeños, pepperoni, spicy chicken with garlic sauce for the bold.',
      price: 519,
      category: 'non-veg',
      isFeatured: false,
      isAvailable: true,
      tags: ['spicy', 'fiery', 'hot'],
      ingredients: { base: 'Thin Crust', sauce: 'Garlic Sauce', cheese: 'Mozzarella', veggies: ['Jalapeno'], meats: ['Chicken', 'Pepperoni'] },
    },
    {
      name: 'Vegan Delight',
      description: 'Plant-based cheese, fresh veggies, pesto sauce on a whole wheat crust.',
      price: 399,
      category: 'vegan',
      isFeatured: false,
      isAvailable: true,
      tags: ['vegan', 'healthy', 'plant-based'],
      ingredients: { base: 'Whole Wheat', sauce: 'Pesto Sauce', cheese: 'Vegan Cheese', veggies: ['Broccoli', 'Capsicum', 'Corn', 'Mushroom'], meats: [] },
    },
    {
      name: 'Paneer Tikka Masala',
      description: 'Indian-inspired with marinated paneer, capsicum, and tangy tomato sauce.',
      price: 429,
      category: 'veg',
      isFeatured: true,
      isAvailable: true,
      tags: ['indian', 'paneer'],
      ingredients: { base: 'Thick Crust', sauce: 'Tomato Sauce', cheese: 'Mozzarella', veggies: ['Paneer', 'Capsicum', 'Onion', 'Tomato'], meats: [] },
    },
  ];

  await Pizza.deleteMany({});
  await Pizza.insertMany(pizzas);
  console.log(`✅ Seeded ${pizzas.length} pizzas`);
};

const seedAdmin = async () => {
  const existingAdmin = await User.findOne({ role: 'admin' });
  if (!existingAdmin) {
    await User.create({
      name: 'PizzaHub Admin',
      email: 'admin@pizzahub.com',
      password: 'Admin@1234',
      role: 'admin',
      isVerified: true,
    });
    console.log('✅ Admin user created: admin@pizzahub.com | Password: Admin@1234');
  } else {
    console.log('ℹ️  Admin already exists');
  }
};

const seed = async () => {
  await connectDB();
  await seedInventory();
  await seedPizzas();
  await seedAdmin();
  console.log('🎉 Database seeded successfully!');
  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
