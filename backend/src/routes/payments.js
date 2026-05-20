const express = require('express');
const router = express.Router();
const { createOrder, verifyPayment, getPaymentHistory, payCash } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.post('/create-order', protect, createOrder);
router.post('/verify', protect, verifyPayment);
router.post('/pay-cash', protect, payCash);
router.get('/history', protect, getPaymentHistory);

module.exports = router;
