const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    razorpayOrderId: {
      type: String,
      required: true,
      unique: true,
    },
    razorpayPaymentId: {
      type: String,
      default: '',
    },
    razorpaySignature: {
      type: String,
      default: '',
    },

    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    status: {
      type: String,
      enum: ['created', 'authorized', 'captured', 'failed', 'refunded'],
      default: 'created',
    },
    method: { type: String, default: '' },
    bank: { type: String, default: '' },
    wallet: { type: String, default: '' },
    vpa: { type: String, default: '' },
    errorCode: { type: String, default: '' },
    errorDescription: { type: String, default: '' },
    notes: { type: Map, of: String },
    capturedAt: { type: Date },
  },
  { timestamps: true }
);

paymentSchema.index({ order: 1 });

paymentSchema.index({ user: 1 });

const Payment = mongoose.model('Payment', paymentSchema);
module.exports = Payment;
