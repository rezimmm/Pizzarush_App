/**
 * controllers/paymentController.js — Razorpay Payment Flow
 * createPaymentOrder → verifyPayment → webhook (optional)
 */

const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Cart = require('../models/Cart');
const { ApiResponse, AppError } = require('../utils/apiResponse');
const { createRazorpayOrder, verifyPaymentSignature, fetchPaymentDetails } = require('../services/paymentService');
const logger = require('../utils/logger');

// ─── POST /api/payments/create-order ─────────────────────────────────────────
// Creates a Razorpay order for a given app order
const createPaymentOrder = async (req, res, next) => {
  const { orderId } = req.body; // Our internal order ID

  const order = await Order.findOne({ _id: orderId, user: req.user._id });
  if (!order) return next(new AppError('Order not found', 404));

  if (order.paymentStatus === 'completed') {
    return next(new AppError('Payment already completed for this order', 400));
  }

  // Create Razorpay order
  const razorpayOrder = await createRazorpayOrder(
    order.totalAmount,
    order.orderId,
    {
      orderId: order.orderId,
      customerEmail: req.user.email,
      customerName: req.user.name,
    }
  );

  // Create payment record
  await Payment.create({
    order: order._id,
    user: req.user._id,
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    status: 'created',
    notes: razorpayOrder.notes,
  });

  return ApiResponse.success(res, {
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
    // Pre-filled info for Razorpay popup
    prefill: {
      name: req.user.name,
      email: req.user.email,
      contact: req.user.phone || '',
    },
    orderData: {
      orderId: order.orderId,
      totalAmount: order.totalAmount,
    },
  }, 'Payment order created');
};

// ─── POST /api/payments/verify ────────────────────────────────────────────────
// Verifies Razorpay payment signature and marks order as paid
const verifyPayment = async (req, res, next) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = req.body;

  // 1. Verify signature (most critical step)
  const isValid = verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
  if (!isValid) {
    // Mark payment as failed
    await Payment.findOneAndUpdate(
      { razorpayOrderId },
      { status: 'failed', errorDescription: 'Signature verification failed' }
    );
    return next(new AppError('Payment verification failed. Invalid signature.', 400));
  }

  // 2. Fetch full payment details from Razorpay
  let paymentDetails;
  try {
    paymentDetails = await fetchPaymentDetails(razorpayPaymentId);
  } catch (e) {
    logger.warn('Could not fetch Razorpay payment details:', e.message);
  }

  // 3. Update payment record
  const payment = await Payment.findOneAndUpdate(
    { razorpayOrderId },
    {
      razorpayPaymentId,
      razorpaySignature,
      status: 'captured',
      method: paymentDetails?.method || '',
      bank: paymentDetails?.bank || '',
      wallet: paymentDetails?.wallet || '',
      vpa: paymentDetails?.vpa || '',
      capturedAt: new Date(),
    },
    { new: true }
  );

  if (!payment) return next(new AppError('Payment record not found', 404));

  // 4. Update order payment status
  const order = await Order.findById(payment.order);
  if (!order) return next(new AppError('Order not found', 404));

  order.paymentStatus = 'completed';
  order.orderStatus = 'order_received'; // Confirm order
  order.statusHistory.push({
    status: 'order_received',
    updatedBy: req.user._id,
    note: `Payment confirmed: ${razorpayPaymentId}`,
  });
  await order.save();

  // 5. Clear the user's cart
  await Cart.findOneAndUpdate({ user: req.user._id }, { items: [], totalAmount: 0 });

  logger.info(`💳 Payment verified: ${razorpayPaymentId} for order ${order.orderId}`);

  return ApiResponse.success(res, {
    orderId: order.orderId,
    _id: order._id,
    paymentId: razorpayPaymentId,
    status: 'success',
  }, 'Payment verified successfully. Order confirmed!');
};

// ─── POST /api/payments/failure — Log payment failure ────────────────────────
const handlePaymentFailure = async (req, res) => {
  const { razorpayOrderId, errorCode, errorDescription } = req.body;

  await Payment.findOneAndUpdate(
    { razorpayOrderId },
    { status: 'failed', errorCode, errorDescription }
  );

  return ApiResponse.success(res, {}, 'Payment failure logged');
};

// ─── GET /api/payments/order/:orderId — Get payment for an order ──────────────
const getPaymentForOrder = async (req, res, next) => {
  const order = await Order.findOne({ _id: req.params.orderId, user: req.user._id });
  if (!order) return next(new AppError('Order not found', 404));

  const payment = await Payment.findOne({ order: order._id });
  return ApiResponse.success(res, { payment });
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
  handlePaymentFailure,
  getPaymentForOrder,
};
