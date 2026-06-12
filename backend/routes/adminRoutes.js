const router = require('express').Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const {
  getOverviewStats,
  getRevenueTrend,
  getPopularItems,
  getOrdersPerDay,
  getLowStockItems,
} = require('../controllers/adminController');

// All admin routes require auth + admin role
router.use(protect, restrictTo('admin'));

router.get('/analytics/overview', getOverviewStats);
router.get('/analytics/revenue-trend', getRevenueTrend);
router.get('/analytics/popular-items', getPopularItems);
router.get('/analytics/orders-per-day', getOrdersPerDay);
router.get('/low-stock', getLowStockItems);

module.exports = router;
