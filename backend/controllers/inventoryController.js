const Inventory = require('../models/Inventory');
const { ApiResponse, AppError } = require('../utils/apiResponse');

const getAllInventory = async (req, res) => {
  const { category, available } = req.query;
  const filter = {};
  if (category) filter.category = category;
  if (available === 'true') filter.isAvailable = true;

  const inventory = await Inventory.find(filter).sort({ category: 1, itemName: 1 });
  return ApiResponse.success(res, { inventory, count: inventory.length });
};

const getAvailableItems = async (req, res) => {
  const items = await Inventory.find({ isAvailable: true }).sort({ category: 1, itemName: 1 });

  const grouped = {
    base: [],
    sauce: [],
    cheese: [],
    veggie: [],
    meat: [],
  };

  items.forEach((item) => {
    if (grouped[item.category]) {
      grouped[item.category].push({
        _id: item._id,
        itemName: item.itemName,
        price: item.price,
        quantity: item.quantity,
        imageUrl: item.imageUrl,
        isAvailable: item.isAvailable,
      });
    }
  });

  return ApiResponse.success(res, { grouped });
};

const getInventoryItem = async (req, res, next) => {
  const item = await Inventory.findById(req.params.id);
  if (!item) return next(new AppError('Inventory item not found', 404));
  return ApiResponse.success(res, { item });
};

const createInventoryItem = async (req, res) => {
  const { category, itemName, quantity, threshold, price, unit, imageUrl } = req.body;

  const item = await Inventory.create({
    category,
    itemName,
    quantity,
    threshold,
    price,
    unit,
    imageUrl,
    logs: [{
      action: 'add',
      quantity,
      reason: 'Initial stock',
      performedBy: req.user._id,
    }],
  });

  return ApiResponse.created(res, { item }, 'Inventory item created');
};

const updateInventoryItem = async (req, res, next) => {
  const { category, itemName, quantity, threshold, price, unit, imageUrl } = req.body;

  const item = await Inventory.findById(req.params.id);
  if (!item) return next(new AppError('Inventory item not found', 404));

  const oldQuantity = item.quantity;

  Object.assign(item, { category, itemName, quantity, threshold, price, unit, imageUrl });

  if (quantity !== undefined && quantity !== oldQuantity) {
    const diff = quantity - oldQuantity;
    item.logs.push({
      action: diff > 0 ? 'add' : 'adjust',
      quantity: Math.abs(diff),
      reason: 'Admin manual update',
      performedBy: req.user._id,
    });
  }

  await item.save();
  return ApiResponse.success(res, { item }, 'Inventory updated');
};

const adjustStock = async (req, res, next) => {
  const { action, quantity, reason } = req.body;

  const item = await Inventory.findById(req.params.id);
  if (!item) return next(new AppError('Inventory item not found', 404));

  if (action === 'add') {
    item.quantity += quantity;
  } else if (action === 'deduct') {
    if (item.quantity < quantity) {
      return next(new AppError('Insufficient stock', 400));
    }
    item.quantity -= quantity;
  } else if (action === 'adjust') {
    item.quantity = quantity;
  } else {
    return next(new AppError('Invalid action. Use add, deduct, or adjust.', 400));
  }

  item.logs.push({
    action,
    quantity,
    reason: reason || 'Manual adjustment',
    performedBy: req.user._id,
  });

  await item.save();
  return ApiResponse.success(res, { item }, 'Stock adjusted');
};

const deleteInventoryItem = async (req, res, next) => {
  const item = await Inventory.findByIdAndDelete(req.params.id);
  if (!item) return next(new AppError('Inventory item not found', 404));
  return ApiResponse.success(res, {}, 'Inventory item deleted');
};

module.exports = {
  getAllInventory,
  getAvailableItems,
  getInventoryItem,
  createInventoryItem,
  updateInventoryItem,
  adjustStock,
  deleteInventoryItem,
};
