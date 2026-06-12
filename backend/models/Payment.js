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
    // Razorpay IDs
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
      required: true, // in paise (INR × 100)
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
    method: { type: String, default: '' }, // card, upi, netbanking, wallet
    bank: { type: String, default: '' },
    wallet: { type: String, default: '' },
    vpa: { type: String, default: '' },   // UPI VPA
    errorCode: { type: String, default: '' },
    errorDescription: { type: String, default: '' },
    notes: { type: Map, of: String },
    capturedAt: { type: Date },
  },
  { timestamps: true }
);

paymentSchema.index({ order: 1 });
// razorpayOrderId index is auto-created by unique:true on the field
paymentSchema.index({ user: 1 });

const Payment = mongoose.model('Payment', paymentSchema);
module.exports = Payment;
