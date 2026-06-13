import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios from 'axios';
import * as crypto from 'crypto';
import { Request, Response } from 'express';
import { AppError } from '../../common/errors/app-error';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/** Port of `src/payment/paymentConroller.js` (Paymob initiate + webhook). */
@Injectable()
export class PaymentService {
  constructor(
    @InjectModel('Payment') private readonly paymentModel: Model<any>,
    @InjectModel('Course') private readonly courseModel: Model<any>,
    @InjectModel('User') private readonly userModel: Model<any>,
    @InjectModel('Coupon') private readonly couponModel: Model<any>,
    private readonly config: ConfigService,
  ) {}

  /**
   * Recompute the HMAC-SHA512 over Paymob's fixed, ordered field list — must match the order exactly
   * or the signature check fails. Ported verbatim from the original `calculateHmac`.
   */
  private calculateHmac(data: any, secret: string): string {
    const {
      amount_cents,
      created_at,
      currency,
      error_occured,
      has_parent_transaction,
      id,
      integration_id,
      is_3d_secure,
      is_auth,
      is_capture,
      is_refunded,
      is_standalone_payment,
      is_voided,
      order: { id: order_id },
      owner,
      pending,
      source_data: { pan: source_data_pan, sub_type: source_data_sub_type, type: source_data_type },
      success,
    } = data;
    const message = `${amount_cents}${created_at}${currency}${error_occured}${has_parent_transaction}${id}${integration_id}${is_3d_secure}${is_auth}${is_capture}${is_refunded}${is_standalone_payment}${is_voided}${order_id}${owner}${pending}${source_data_pan}${source_data_sub_type}${source_data_type}${success}`;
    return crypto.createHmac('sha512', secret).update(message).digest('hex');
  }

  async initiate(body: InitiatePaymentDto, user: any) {
    try {
      const { currency, customer, courseId, couponId } = body;

      const course = await this.courseModel.findById(courseId);
      if (!course) {
        throw new AppError('Course not found', 404);
      }

      let coursePrice: number;
      const coupon = await this.couponModel.findById(couponId);
      if (coupon) {
        const discountAmount = course.price * (coupon.discount / 100);
        coursePrice = discountAmount * 100;
      } else {
        coursePrice = course.price * 100;
      }

      // Step 1: Authentication
      const authResponse = await axios.post('https://accept.paymob.com/api/auth/tokens', {
        api_key: this.config.get<string>('PAYMOB_API_KEY'),
      });
      if (!authResponse.data.token) {
        throw new AppError('Failed to obtain authentication token', 500);
      }
      const token = authResponse.data.token;

      await delay(2000);

      // Step 2: Create Order
      const orderResponse = await axios.post('https://accept.paymob.com/api/ecommerce/orders', {
        auth_token: token,
        delivery_needed: false,
        amount_cents: coursePrice,
        currency,
        items: [{ name: course.title, amount_cents: coursePrice, description: 'Payment for course' }],
      });
      if (!orderResponse.data.id) {
        throw new AppError('Failed to create order', 500);
      }
      const orderId = orderResponse.data.id;

      const billingData = {
        apartment: customer?.apartment || 'NA',
        email: customer?.email || 'test@example.com',
        floor: customer?.floor || 'NA',
        first_name: customer?.first_name || 'Test',
        street: customer?.street || 'NA',
        building: customer?.building || 'NA',
        phone_number: customer?.phone_number || '+201143776030',
        shipping_method: 'NA',
        postal_code: customer?.postal_code || 'NA',
        city: customer?.city || 'Cairo',
        country: customer?.country || 'EGY',
        last_name: customer?.last_name || 'User',
        state: customer?.state || 'NA',
      };

      await delay(1000);

      // Step 3: Payment Key Request
      const paymentKeyResponse = await axios.post('https://accept.paymob.com/api/acceptance/payment_keys', {
        auth_token: token,
        amount_cents: coursePrice,
        expiration: 3600,
        order_id: orderId,
        billing_data: billingData,
        currency,
        integration_id: this.config.get<string>('PAYMOB_INTEGRATION_ID_Online_Card'),
        metadata: {
          courseId: course._id.toString(),
          userId: user._id.toString(),
        },
      });
      if (!paymentKeyResponse.data.token) {
        throw new AppError('Failed to obtain payment key', 500);
      }

      const newPayment = new this.paymentModel({
        course: course._id,
        user: user._id,
        orderId,
        amount: coursePrice,
        currency,
        customer: billingData,
      });
      await newPayment.save();

      const paymentKey = paymentKeyResponse.data.token;
      return { paymentKey };
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Error initiating payment:', error.message);
      throw new AppError('Payment initiation failed', 500);
    }
  }

  /**
   * Public webhook (no auth). Verifies authenticity by recomputing the HMAC over `data.obj` and
   * comparing against `req.query.hmac`. On success flips `payment.status` and grants course access
   * by pushing the course into the buyer's `subscribedCourses`.
   */
  async paymentWebhook(req: Request, res: Response): Promise<void> {
    try {
      const data: any = req.body;
      if (!data) {
        console.error('Request body is empty');
        res.status(400).send('Bad Request: No data received');
        return;
      }
      const receivedHmac = req.query.hmac as string;
      if (!receivedHmac) {
        console.error('No HMAC signature found in query params');
        res.status(400).send('Invalid signature');
        return;
      }
      const calculatedHmac = this.calculateHmac(data.obj, this.config.get<string>('HMAC_SECRET'));
      if (receivedHmac !== calculatedHmac) {
        console.error('HMAC validation failed');
        res.status(400).send('Invalid signature');
        return;
      }
      const payment = await this.paymentModel.findOne({ orderId: data.obj.order.id });
      if (!payment) {
        console.error('Payment not found');
        res.status(404).send('Payment not found');
        return;
      }
      payment.status = data.obj.success;
      payment.hmac = calculatedHmac;
      await payment.save();

      if (!data.obj.success) {
        res.status(402).send('Payment failed');
        return;
      }
      const user = await this.userModel.findById(payment.user);
      if (!user) {
        console.error('User not found');
        res.status(404).send('User not found');
        return;
      }
      user.subscribedCourses.push(payment.course);
      await user.save();
      res.status(200).send('Payment received');
    } catch (error) {
      console.error('Payment handling error:', error.message);
      res.status(500).send('Internal Server Error');
    }
  }
}
