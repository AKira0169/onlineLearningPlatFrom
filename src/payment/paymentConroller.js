const axios = require('axios');
const Payment = require('./paymentModel');
const crypto = require('crypto');
require('dotenv').config();

const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY;
const PAYMOB_INTEGRATION_ID = process.env.PAYMOB_INTEGRATION_ID;
const SECRET_KEY = process.env.SECRET_KEY;

exports.initiate = async (req, res) => {
  try {
    const { amount, currency, customer } = req.body;

    // Step 1: Authentication
    const authResponse = await axios.post('https://accept.paymob.com/api/auth/tokens', {
      api_key: PAYMOB_API_KEY,
    });

    if (!authResponse.data.token) {
      throw new Error('Failed to obtain authentication token');
    }

    const token = authResponse.data.token;

    // Step 2: Create Order
    const orderResponse = await axios.post('https://accept.paymob.com/api/ecommerce/orders', {
      auth_token: token,
      delivery_needed: false,
      amount_cents: amount,
      currency,
      items: [],
    });

    if (!orderResponse.data.id) {
      throw new Error('Failed to create order');
    }

    const orderId = orderResponse.data.id;

    // Step 3: Payment Key Request
    const paymentKeyResponse = await axios.post('https://accept.paymob.com/api/acceptance/payment_keys', {
      auth_token: token,
      amount_cents: amount,
      expiration: 3600,
      order_id: orderId,
      billing_data: customer,
      currency,
      integration_id: PAYMOB_INTEGRATION_ID,
    });

    if (!paymentKeyResponse.data.token) {
      throw new Error('Failed to obtain payment key');
    }

    const paymentKey = paymentKeyResponse.data.token;

    res.json({ paymentKey });
  } catch (error) {
    console.error('Error initiating payment:', error.message);
    res.status(500).json({ error: 'Payment initiation failed' });
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
