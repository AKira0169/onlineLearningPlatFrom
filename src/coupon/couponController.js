const Course=require('../courses/courseModel')
const Coupon=require('../coupon/couponModel')
const expressAsyncHandler = require('express-async-handler');
const AppError = require('../../utils/appError');



exports.createCoupon = expressAsyncHandler(async (req, res, next) => {
    const { course, discount, couponCode, expiryDate } = req.body;
    if (!course || !discount || !couponCode || !expiryDate) {
      return next(new AppError('All fields are required', 400));
    }
  
    const newCoupon = new Coupon({
      course,
      discount,
      couponCode,
      expiryDate,
    });
  
    const savedCoupon = await newCoupon.save();
    res.status(201).json(savedCoupon);
  });

exports.getAllCoupons = expressAsyncHandler(async (req, res, next) => {
    const coupons = await Coupon.find();
    res.status(200).json(coupons);
  });

  exports.getCouponById = expressAsyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const coupon = await Coupon.findById(id);
  
    if (!coupon) {
      return next(new AppError('Coupon not found', 404));
    }
  
    res.status(200).json(coupon);
  });
  


  exports.updateCoupon = expressAsyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { course, discount, couponCode, expiryDate } = req.body;
  
    const coupon = await Coupon.findByIdAndUpdate(
      id,
      { course, discount, couponCode, expiryDate },
      { new: true, runValidators: true }
    );
  
    if (!coupon) {
      return next(new AppError('Coupon not found', 404));
    }
  
    res.status(200).json(coupon);
  });
  
 exports.deleteCoupon = expressAsyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const coupon = await Coupon.findByIdAndDelete(id);
  
    if (!coupon) {
      return next(new AppError('Coupon not found', 404));
    }
  
    res.status(204).send();
  });
  

  exports.applyCouponToCourse = expressAsyncHandler(async (req, res, next) => {
    const { courseId, couponCode } = req.body;
  
    if (!courseId || !couponCode) {
      return next(new AppError('Course ID and Coupon Code are required', 400));
    }
  

    const coupon = await Coupon.findOne({ couponCode });
  
    if (!coupon) {
      return next(new AppError('Coupon not found', 404));
    }
  

    if (new Date() > coupon.expiryDate) {
      return next(new AppError('Coupon has expired', 400));
    }

    const course = await Course.findById(courseId);
  
    if (!course) {
      return next(new AppError('Course not found', 404));
    }
    const discountAmount = course.price * (coupon.discount / 100);
    const updatedPrice = course.price - discountAmount;
    course.price = updatedPrice;
    await course.save();
  
    res.status(200).json({
      message: 'Coupon applied successfully',
      course,
      appliedCoupon: {
        couponCode: coupon.couponCode,
        discount: coupon.discount,
        expiryDate: coupon.expiryDate,
      },
    });
  });