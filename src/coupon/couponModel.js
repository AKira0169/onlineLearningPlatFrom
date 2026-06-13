const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    course: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
      },
    ],
    discount: {
      type: Number,
      required: true,
    },
    couponCode: {
      type: String,
      required: true, 
      unique: true, 
      set: (value) => value.toUpperCase(), 
    },
    expiryDate: {
      type: Date,
      required: true, 
    },
  },
  {
    timestamps: true,
  },
);

const Coupon = mongoose.model('Coupon', couponSchema);

module.exports = Coupon;
