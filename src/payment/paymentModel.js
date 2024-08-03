const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  orderId: String,
  amount: Number,
  currency: String,
  customer: Object,
  status: String,
  hmac: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Payment', paymentSchema);
