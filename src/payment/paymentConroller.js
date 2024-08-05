const axios = require('axios');
const Payment = require('./paymentModel');
const crypto = require('crypto');
const AppError = require('../../utils/appError'); // Adjust the path to your AppError file

const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY;
const PAYMOB_INTEGRATION_ID_Online_Card = process.env.PAYMOB_INTEGRATION_ID_Online_Card;
const PAYMOB_INTEGRATION_ID_Mobile_Wallet = process.env.PAYMOB_INTEGRATION_ID_Mobile_Wallet;
const SECRET_KEY = process.env.SECRET_KEY;

// Utility function to add a delay
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

exports.initiate = async (req, res, next) => {
  try {
    const { amount, currency, customer, paymentMethod } = req.body;

    // Step 1: Authentication
    const authResponse = await axios.post('https://accept.paymob.com/api/auth/tokens', {
      api_key: PAYMOB_API_KEY,
    });

    if (!authResponse.data.token) {
      return next(new AppError('Failed to obtain authentication token', 500));
    }

    const token = authResponse.data.token;
    console.log(token);

    // Add a delay before the next request
    await delay(2000);

    // Step 2: Create Order
    const orderResponse = await axios.post('https://accept.paymob.com/api/ecommerce/orders', {
      auth_token: token,
      delivery_needed: false,
      amount_cents: amount,
      currency,
      items: [
        {
          name: 'Service',
          amount_cents: amount,
          description: 'Payment for services',
        },
      ],
    });

    if (!orderResponse.data.id) {
      return next(new AppError('Failed to create order', 500));
    }
    console.log('iam orderResponse', orderResponse);

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
      amount_cents: amount,
      expiration: 3600,
      order_id: orderId,
      billing_data: billingData,
      currency,
      integration_id: PAYMOB_INTEGRATION_ID_Online_Card,
    });

    if (!paymentKeyResponse.data.token) {
      return next(new AppError('Failed to obtain payment key', 500));
    }

    const paymentKey = paymentKeyResponse.data.token;
    // res.redirect(`https://accept.paymob.com/api/acceptance/iframes/859570?payment_token=${paymentKey}`);
    res.json({ paymentKey });
  } catch (error) {
    console.error('Error initiating payment:', error.message);
    return next(new AppError('Payment initiation failed', 500));
  }
};

const calculateHmac = (data, secret) => {
  const hmac = crypto.createHmac('sha512', secret);
  hmac.update(JSON.stringify(data));
  return hmac.digest('hex');
};

// Payment webhook endpoint
exports.paymentWebhook = async (req, res) => {
  try {
    const data = req.body;

    // Validate HMAC
    const receivedHmac = req.headers['x-signature'];
    const calculatedHmac = calculateHmac(data, SECRET_KEY);

    if (receivedHmac !== calculatedHmac) {
      console.error('HMAC validation failed');
      return res.status(400).send('Invalid signature');
    }

    // Store data in the database
    const newPayment = new Payment({
      orderId: data.order.id,
      amount: data.amount_cents,
      currency: data.currency,
      customer: data.billing_data,
      status: data.success ? 'success' : 'failed',
      hmac: calculatedHmac,
    });

    await newPayment.save();

    // Respond to Paymob to acknowledge receipt
    res.status(200).send('Payment received');
  } catch (error) {
    console.error('Payment handling error:', error.message);
    res.status(500).send('Internal Server Error');
  }
};
