const express = require('express');
const paymentConroller = require('./paymentConroller');
const authController = require('../../middleware/authController');
const authorization = require('../../middleware/authorization');
const router = express.Router();

router.post('/paymob/webhook', paymentConroller.paymentWebhook);
router.use(authController.protect);

router.post('/paymob/initiate', paymentConroller.initiate);

module.exports = router;
