const express = require('express');
const router = express.Router();
const { createBooking, getUserBookings, getBooking, cancelBooking, getAllBookings, startBookingWithPin } = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, createBooking);
router.get('/my', protect, getUserBookings);
router.get('/all', protect, authorize('admin', 'superadmin', 'manager'), getAllBookings);
router.put('/start-with-pin', protect, authorize('admin', 'superadmin', 'manager'), startBookingWithPin);
router.put('/:id/start', protect, authorize('admin', 'superadmin', 'manager'), startBookingWithPin);
router.get('/:id', protect, getBooking);
router.put('/:id/cancel', protect, cancelBooking);

module.exports = router;
