const express = require('express');
const router = express.Router();
const couponController=require('../coupon/couponController')
const authController = require('../../middleware/authController');
const authorization = require('../../middleware/authorization');
router.use(authController.protect);
router.use(authorization.restrictTo('admin', 'instructor'));

router.post('/createcoupon', couponController.createCoupon);

router.get('/getallcoupons', couponController.getAllCoupons);


router.get('/getacoupnbyid/:id', couponController.getCouponById);


router.put('/updatecoupon/:id',couponController.updateCoupon);
router.delete('/deletecoupon/:id', couponController.deleteCoupon);
router.post('/applycoupon', couponController.applyCouponToCourse)
module.exports = router;