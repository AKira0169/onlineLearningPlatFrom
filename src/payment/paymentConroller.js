const axios = require('axios');
const Payment = require('./paymentModel');
const Course = require('../courses/courseModel');
const User = require('../users/usersModel');
const crypto = require('crypto');
const AppError = require('../../utils/appError'); 
const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY;
const PAYMOB_INTEGRATION_ID_Online_Card = process.env.PAYMOB_INTEGRATION_ID_Online_Card;
const PAYMOB_INTEGRATION_ID_Mobile_Wallet = process.env.PAYMOB_INTEGRATION_ID_Mobile_Wallet;
const SECRET_KEY = process.env.Secret_Key;

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const calculateHmac = (data, secret) => {

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
    order: { id: order_id }, // Destructure nested order.id
    owner,
    pending,
    source_data: { pan: source_data_pan, sub_type: source_data_sub_type, type: source_data_type },
    success,
  } = data;
  const message = `${amount_cents}${created_at}${currency}${error_occured}${has_parent_transaction}${id}${integration_id}${is_3d_secure}${is_auth}${is_capture}${is_refunded}${is_standalone_payment}${is_voided}${order_id}${owner}${pending}${source_data_pan}${source_data_sub_type}${source_data_type}${success}`;
  // Calculate HMAC using the sha512 algorithm
  const hash = crypto.createHmac('sha512', secret).update(message).digest('hex');
  return hash;
};

exports.initiate = async (req, res, next) => {
  try {
    const { currency, customer, courseId } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return next(new AppError('Course not found', 404));
    }
    const coursePrice = course.price * 100;

    // Step 1: Authentication
    const authResponse = await axios.post('https://accept.paymob.com/api/auth/tokens', {
      api_key: PAYMOB_API_KEY,
    });

    if (!authResponse.data.token) {
      return next(new AppError('Failed to obtain authentication token', 500));
    }

    const token = authResponse.data.token;

    // Add a delay before the next request
    await delay(2000);

    // Step 2: Create Order
    const orderResponse = await axios.post('https://accept.paymob.com/api/ecommerce/orders', {
      auth_token: token,
      delivery_needed: false,
      amount_cents: coursePrice,
      currency,
      items: [
        {
          name: course.title,
          amount_cents: coursePrice,
          description: 'Payment for course',
        },
      ],
    });

    if (!orderResponse.data.id) {
      return next(new AppError('Failed to create order', 500));
    }

    const orderId = orderResponse.data.id;

    // Ensure customer billing data is complete
    const billingData = {
      apartment: customer.apartment || 'NA',
      email: customer.email || 'test@example.com',
      floor: customer.floor || 'NA',
      first_name: customer.first_name || 'Test',
      street: customer.street || 'NA',
      building: customer.building || 'NA',
      phone_number: customer.phone_number || '+201143776030',
      shipping_method: 'NA',
      postal_code: customer.postal_code || 'NA',
      city: customer.city || 'Cairo',
      country: customer.country || 'EGY',
      last_name: customer.last_name || 'User',
      state: customer.state || 'NA',
    };

    // Add a delay before the next request
    await delay(1000);

    // Step 3: Payment Key Request
    const paymentKeyResponse = await axios.post('https://accept.paymob.com/api/acceptance/payment_keys', {
      auth_token: token,
      amount_cents: coursePrice,
      expiration: 3600,
      order_id: orderId,
      billing_data: billingData,
      currency,
      integration_id: PAYMOB_INTEGRATION_ID_Online_Card,
      metadata: {
        courseId: course._id.toString(), // Ensure these are strings
        userId: req.user._id.toString(),
      },
    });

    if (!paymentKeyResponse.data.token) {
      return next(new AppError('Failed to obtain payment key', 500));
    }

    const newPayment = new Payment({
      course: course._id,
      user: req.user._id,
      orderId: orderId,
      amount: coursePrice,
      currency: currency,
      customer: billingData,
    });

    await newPayment.save();

    const paymentKey = paymentKeyResponse.data.token;
    // res.redirect(`https://accept.paymob.com/api/acceptance/iframes/859570?payment_token=${paymentKey}`);
    res.json({ paymentKey });
  } catch (error) {
    console.error('Error initiating payment:', error.message);
    return next(new AppError('Payment initiation failed', 500));
  }
};

exports.paymentWebhook = async (req, res) => {
  try {
    const data = req.body;
    if (!data) {
      console.error('Request body is empty');
      return res.status(400).send('Bad Request: No data received');
    }
    const receivedHmac = req.query.hmac;
    if (!receivedHmac) {
      console.error('No HMAC signature found in query params');
      return res.status(400).send('Invalid signature');
    }
    const calculatedHmac = calculateHmac(data.obj, process.env.HMAC_SECRET);
    if (receivedHmac !== calculatedHmac) {
      console.error('HMAC validation failed');
      return res.status(400).send('Invalid signature');
    }
    console.log(data);
    const payment = await Payment.findOne({ orderId: data.obj.order.id });
    if (!payment) {
      console.error('Payment not found');
      return res.status(404).send('Payment not found');
    }
    payment.status = data.obj.success;
    payment.hmac = calculatedHmac;
    await payment.save();

    if (!data.obj.success) {
      return res.status(402).send('Payment failed');
    }
    const user = await User.findById(payment.user);
    if (!user) {
      console.error('User not found');
      return res.status(404).send('User not found');
    }
    user.subscribedCourses.push(payment.course);
    await user.save();
    res.status(200).send('Payment received');
  } catch (error) {
    console.error('Payment handling error:', error.message);
    res.status(500).send('Internal Server Error');
  }
};
