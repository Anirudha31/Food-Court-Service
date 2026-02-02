const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  payment_id: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  order_id: {
    type: String,
    required: true,
    trim: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  payment_gateway_id: {
    type: String,
    required: true,
    trim: true
  },
  payer_name: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  status: {
    type: String,
    enum: ['created', 'captured', 'failed', 'refunded'],
    default: 'created'
  },
  payment_method: {
    type: String,
    enum: ['online', 'wallet', 'upi'],
    default: 'online'
  },
  payment_time: {
    type: Date,
    default: Date.now
  },
  refund_id: {
    type: String,
    trim: true
  },
  refund_amount: {
    type: Number,
    min: 0
  },
  refund_time: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient queries
paymentSchema.index({ order_id: 1 });
paymentSchema.index({ user_id: 1, payment_time: -1 });
paymentSchema.index({ status: 1, payment_time: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
