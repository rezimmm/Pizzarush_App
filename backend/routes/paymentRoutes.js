const router = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createPaymentOrder,
  verifyPayment,
  handlePaymentFailure,
  getPaymentForOrder,
} = require('../controllers/paymentController');

router.use(protect);

router.post('/create-order', createPaymentOrder);
router.post('/verify', verifyPayment);
router.post('/failure', handlePaymentFailure);
router.get('/order/:orderId', getPaymentForOrder);

module.exports = router;
