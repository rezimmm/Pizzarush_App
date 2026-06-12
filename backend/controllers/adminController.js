/**
 * controllers/adminController.js — Admin Analytics & Dashboard
 */

const Order = require('../models/Order');
const User = require('../models/User');
const Inventory = require('../models/Inventory');
const Payment = require('../models/Payment');
const { ApiResponse } = require('../utils/apiResponse');

// ─── GET /api/admin/analytics/overview ───────────────────────────────────────
const getOverviewStats = async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalOrders,
    totalRevenue,
    activeUsers,
    pendingOrders,
    todayOrders,
    todayRevenue,
  ] = await Promise.all([
    Order.countDocuments({ paymentStatus: 'completed' }),
    Order.aggregate([
      { $match: { paymentStatus: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
    User.countDocuments({ role: 'customer', isActive: true }),
    Order.countDocuments({ orderStatus: { $in: ['order_received', 'in_kitchen', 'out_for_delivery'] } }),
    Order.countDocuments({ createdAt: { $gte: today }, paymentStatus: 'completed' }),
    Order.aggregate([
      { $match: { createdAt: { $gte: today }, paymentStatus: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
  ]);

  return ApiResponse.success(res, {
    totalOrders,
    totalRevenue: totalRevenue[0]?.total || 0,
    activeUsers,
    pendingOrders,
    todayOrders,
    todayRevenue: todayRevenue[0]?.total || 0,
  });
};

// ─── GET /api/admin/analytics/revenue-trend ──────────────────────────────────
const getRevenueTrend = async (req, res) => {
  const { days = 7 } = req.query;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - Number(days));
  startDate.setHours(0, 0, 0, 0);

  const trend = await Order.aggregate([
    {
      $match: {
        paymentStatus: 'completed',
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$totalAmount' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        date: '$_id',
        revenue: 1,
        orders: 1,
        _id: 0,
      },
    },
  ]);

  return ApiResponse.success(res, { trend });
};

// ─── GET /api/admin/analytics/popular-items ───────────────────────────────────
const getPopularItems = async (req, res) => {
  // Most ordered pizza bases (from custom orders)
  const popularBases = await Order.aggregate([
    { $unwind: '$items' },
    { $match: { 'items.itemType': 'custom' } },
    {
      $group: {
        _id: '$items.customDetails.base',
        count: { $sum: '$items.quantity' },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 5 },
    { $project: { name: '$_id', count: 1, _id: 0 } },
  ]);

  // Most popular pizzas from menu
  const popularPizzas = await Order.aggregate([
    { $unwind: '$items' },
    { $match: { 'items.itemType': 'pizza' } },
    {
      $group: {
        _id: '$items.name',
        count: { $sum: '$items.quantity' },
        revenue: { $sum: '$items.totalPrice' },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 5 },
    { $project: { name: '$_id', count: 1, revenue: 1, _id: 0 } },
  ]);

  // Popular toppings
  const popularVeggies = await Order.aggregate([
    { $unwind: '$items' },
    { $match: { 'items.itemType': 'custom', 'items.customDetails.veggies': { $exists: true } } },
    { $unwind: '$items.customDetails.veggies' },
    {
      $group: {
        _id: '$items.customDetails.veggies',
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 8 },
    { $project: { name: '$_id', count: 1, _id: 0 } },
  ]);

  return ApiResponse.success(res, { popularBases, popularPizzas, popularVeggies });
};

// ─── GET /api/admin/analytics/orders-per-day ─────────────────────────────────
const getOrdersPerDay = async (req, res) => {
  const { days = 30 } = req.query;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - Number(days));

  const data = await Order.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { date: '$_id', count: 1, _id: 0 } },
  ]);

  return ApiResponse.success(res, { data });
};

// ─── GET /api/admin/low-stock ─────────────────────────────────────────────────
const getLowStockItems = async (req, res) => {
  const items = await Inventory.find({ $expr: { $lte: ['$quantity', '$threshold'] } });
  return ApiResponse.success(res, { items, count: items.length });
};

module.exports = {
  getOverviewStats,
  getRevenueTrend,
  getPopularItems,
  getOrdersPerDay,
  getLowStockItems,
};
