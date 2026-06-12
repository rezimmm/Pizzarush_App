const Razorpay = require('razorpay');
const crypto = require('crypto');
const logger = require('../utils/logger');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const createRazorpayOrder = async (amount, receipt, notes = {}) => {
  try {
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Convert to paise
      currency: 'INR',
      receipt,
      notes,
      payment_capture: 1, // Auto capture payment
    });

    logger.info(`💳 Razorpay order created: ${order.id}`);
    return order;
  } catch (error) {
    logger.error('Razorpay order creation failed:', error);
    throw new Error(`Payment initialization failed: ${error.message || error.error?.description}`);
  }
};

const verifyPaymentSignature = (razorpayOrderId, razorpayPaymentId, signature) => {
  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  const isValid = expectedSignature === signature;
  if (!isValid) {
    logger.warn(`⚠️  Invalid payment signature for order: ${razorpayOrderId}`);
  }
  return isValid;
};

const fetchPaymentDetails = async (paymentId) => {
  try {
    return await razorpay.payments.fetch(paymentId);
  } catch (error) {
    logger.error('Failed to fetch payment details:', error);
    throw new Error('Failed to fetch payment details');
  }
};

module.exports = {
  createRazorpayOrder,
  verifyPaymentSignature,
  fetchPaymentDetails,
};
