import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppError } from '../../common/errors/app-error';
import { ApplyCouponDto, CouponDto } from './dto/coupon.dto';

/** Port of `src/coupon/couponController.js`. */
@Injectable()
export class CouponService {
  constructor(
    @InjectModel('Coupon') private readonly couponModel: Model<any>,
    @InjectModel('Course') private readonly courseModel: Model<any>,
  ) {}

  async createCoupon(body: CouponDto) {
    const { course, discount, couponCode, expiryDate } = body;
    if (!course || !discount || !couponCode || !expiryDate) {
      throw new AppError('All fields are required', 400);
    }
    const newCoupon = new this.couponModel({ course, discount, couponCode, expiryDate });
    return newCoupon.save();
  }

  async getAllCoupons() {
    return this.couponModel.find().lean();
  }

  async getCouponById(id: string) {
    const coupon = await this.couponModel.findById(id);
    if (!coupon) {
      throw new AppError('Coupon not found', 404);
    }
    return coupon;
  }

  async updateCoupon(id: string, body: CouponDto) {
    const { course, discount, couponCode, expiryDate } = body;
    const coupon = await this.couponModel.findByIdAndUpdate(
      id,
      { course, discount, couponCode, expiryDate },
      { new: true, runValidators: true },
    );
    if (!coupon) {
      throw new AppError('Coupon not found', 404);
    }
    return coupon;
  }

  async deleteCoupon(id: string) {
    const coupon = await this.couponModel.findByIdAndDelete(id);
    if (!coupon) {
      throw new AppError('Coupon not found', 404);
    }
  }

  async applyCouponToCourse(body: ApplyCouponDto) {
    const { courseId, couponCode } = body;
    if (!courseId || !couponCode) {
      throw new AppError('Course ID and Coupon Code are required', 400);
    }

    const coupon = await this.couponModel.findOne({ couponCode });
    if (!coupon) {
      throw new AppError('Coupon not found', 404);
    }

    if (new Date() > coupon.expiryDate) {
      throw new AppError('Coupon has expired', 400);
    }

    const course = await this.courseModel.findById(courseId);
    if (!course) {
      throw new AppError('Course not found', 404);
    }
    const discountAmount = course.price * (coupon.discount / 100);
    course.price = course.price - discountAmount;
    await course.save();

    return {
      message: 'Coupon applied successfully',
      course,
      appliedCoupon: {
        couponCode: coupon.couponCode,
        discount: coupon.discount,
        expiryDate: coupon.expiryDate,
      },
    };
  }
}
