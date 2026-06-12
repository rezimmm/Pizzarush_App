const router = require('express').Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const {
  createOrder,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  getAllOrders,
} = require('../controllers/orderController');

router.use(protect);

router.post('/', createOrder);
router.get('/my-orders', getMyOrders);

// Admin routes MUST come before /:id to avoid being caught as an id param
router.get('/admin/all', restrictTo('admin'), getAllOrders);
router.patch('/:id/status', restrictTo('admin'), updateOrderStatus);

router.get('/:id', getOrderById);

module.exports = router;
