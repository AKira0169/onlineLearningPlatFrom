const express = require('express');
const paymentConroller = require('./paymentConroller');
const router = express.Router();

router.post('/paymob/initiate', paymentConroller.initiate);

router.post('/paymob/webhook', paymentConroller.paymentWebhook);

module.exports = router;
