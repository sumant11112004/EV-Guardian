const Booking = require('../models/Booking');
const Station = require('../models/Station');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');

// Helper: generate booking ref
const generateRef = () => 'CPX-' + uuidv4().split('-')[0].toUpperCase();

// @desc Create booking
exports.createBooking = async (req, res, next) => {
  try {
    const { stationId, chargerIndex, startTime, endTime, duration, vehicleNumber, paymentMethod } = req.body;
    if (!vehicleNumber) return res.status(400).json({ success: false, message: 'Vehicle number is required' });
    const station = await Station.findById(stationId);
    if (!station) return res.status(404).json({ success: false, message: 'Station not found' });
    if (station.status !== 'active') return res.status(400).json({ success: false, message: 'Station unavailable' });

    const charger = station.chargers[chargerIndex];
    if (!charger) return res.status(400).json({ success: false, message: 'Charger not found' });

    // Check for conflicting bookings properly
    const overlappingBookings = await Booking.countDocuments({
      station: stationId,
      chargerIndex,
      status: { $in: ['pending', 'confirmed', 'active'] },
      startTime: { $lt: new Date(endTime) },
      endTime: { $gt: new Date(startTime) }
    });

    if (overlappingBookings >= charger.totalSlots) {
      return res.status(409).json({ success: false, message: 'All slots for this charger are currently booked for the selected time.' });
    }

    const estimatedEnergy = (charger.power * duration) / 60;
    const estimatedCost = estimatedEnergy * charger.pricePerKwh;
    const carbonSaved = estimatedEnergy * 0.82; // kg CO2 per kWh saved

    const bookingRef = generateRef();
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    const qrCode = await QRCode.toDataURL(pin);

    const booking = await Booking.create({
      user: req.user._id,
      station: stationId,
      chargerIndex,
      chargerType: charger.type,
      vehicleNumber,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      duration,
      estimatedEnergy,
      estimatedCost,
      pricePerKwh: charger.pricePerKwh,
      bookingRef,
      carbonSaved,
      pin,
      qrCode,
    });

    // Create notification
    await Notification.create({
      user: req.user._id,
      title: 'Booking Created',
      message: `Your booking at ${station.name} is pending payment. Ref: ${booking.bookingRef}`,
      type: 'booking_confirmed',
      link: `/bookings/${booking._id}`,
    });

    // Send confirmation email immediately for cash payments
    if (paymentMethod === 'cash') {
      try {
        const sendEmail = require('../utils/sendEmail');
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #8cc63f; text-align: center;">EV Guardian Booking Reserved (Cash Payment)</h2>
            <p>Hi ${req.user.name},</p>
            <p>Your slot reservation was successful. Please pay in cash at the station upon arrival. Here are your booking details:</p>
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
              <p style="margin: 5px 0;"><strong>Reference ID:</strong> ${booking.bookingRef}</p>
              <p style="margin: 5px 0;"><strong>Station:</strong> ${station.name}</p>
              <p style="margin: 5px 0;"><strong>Address:</strong> ${station.address?.street || ''}, ${station.address?.city || ''}</p>
              <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(startTime).toLocaleDateString()}</p>
              <p style="margin: 5px 0;"><strong>Time:</strong> ${new Date(startTime).toLocaleTimeString()} - ${new Date(endTime).toLocaleTimeString()}</p>
              <p style="margin: 5px 0;"><strong>Charger Type:</strong> ${charger.type}</p>
              <p style="margin: 5px 0;"><strong>Duration:</strong> ${duration} minutes</p>
              <p style="margin: 5px 0;"><strong>Estimated Cost:</strong> ₹${estimatedCost.toFixed(0)}</p>
            </div>
            <div style="text-align: center; margin: 30px 0; background: #f0fdf4; border: 2px dashed #8cc63f; border-radius: 12px; padding: 20px; max-width: 300px; margin: 20px auto;">
              <p style="color: #166534; font-size: 12px; text-transform: uppercase; font-weight: bold; letter-spacing: 1px; margin: 0 0 8px 0;">Your Check-In PIN</p>
              <h1 style="color: #15803d; font-family: monospace; font-size: 32px; font-weight: 900; letter-spacing: 8px; margin: 0; padding: 0;">${booking.pin || '------'}</h1>
              <p style="color: #64748b; font-size: 11px; margin: 8px 0 0 0;">Provide this 6-digit code to the station manager upon arrival to check-in and start your charging session.</p>
            </div>
            <p style="color: #64748b; font-size: 14px; text-align: center;">Thank you for driving electric with EV Guardian!</p>
          </div>
        `;
        await sendEmail({
          to: req.user.email,
          subject: `Booking Reserved: ${booking.bookingRef}`,
          html: emailHtml
        });
      } catch (emailErr) {
        console.error("[Email System] Failed to send cash booking email:", emailErr);
      }
    }

    const populated = await booking.populate('station', 'name address images');
    res.status(201).json({ success: true, booking: populated });
  } catch (err) { next(err); }
};

// @desc Get user bookings
exports.getUserBookings = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = { user: req.user._id };
    if (status) query.status = status;
    const bookings = await Booking.find(query)
      .populate('station', 'name address images chargers')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    const total = await Booking.countDocuments(query);
    res.status(200).json({ success: true, bookings, total, pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

// @desc Get single booking
exports.getBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('station', 'name address images chargers')
      .populate('user', 'name email');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.user._id.toString() !== req.user._id.toString() && req.user.role === 'user') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    res.status(200).json({ success: true, booking });
  } catch (err) { next(err); }
};

// @desc Cancel booking
exports.cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (['completed', 'cancelled'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: `Cannot cancel a ${booking.status} booking` });
    }

    const now = new Date();
    if (booking.status === 'confirmed') {
      if (now > booking.startTime) {
        return res.status(400).json({ success: false, message: 'Cannot manually cancel an ongoing booking. It will be auto-cancelled if you do not show up.' });
      }

      if (booking.payment) {
        const Razorpay = require('razorpay');
        const Payment = require('../models/Payment');
        const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
        
        const payment = await Payment.findById(booking.payment);
        if (payment && payment.razorpayPaymentId) {
          const refundAmount = payment.amount * 0.95; // 5% deduction
          const refundAmountInPaise = Math.round(refundAmount * 100);
          try {
            await razorpay.payments.refund(payment.razorpayPaymentId, { amount: refundAmountInPaise, speed: "normal" });
            payment.status = 'refunded';
            payment.refundAmount = refundAmount;
            payment.refundedAt = new Date();
            await payment.save();
          } catch (e) {
            console.error("Razorpay refund failed for booking", booking._id, e);
            // We do NOT block cancellation here. In test mode, uncaptured or instant payments might throw BAD_REQUEST.
            booking.cancellationReason = req.body.reason ? req.body.reason + ' (Note: Automated refund failed, requires manual check)' : 'User cancelled (Automated refund failed)';
          }
        }
      }
    }

    booking.status = 'cancelled';
    booking.cancellationReason = req.body.reason || 'User cancelled before start time';
    booking.cancelledAt = new Date();
    await booking.save({ validateBeforeSave: false });

    // We no longer manually increment availableSlots, it's calculated dynamically via overlapping bookings.

    await Notification.create({
      user: req.user._id,
      title: 'Booking Cancelled',
      message: `Your booking ${booking.bookingRef} has been cancelled. Refund will be processed shortly.`,
      type: 'booking_cancelled',
    });

    res.status(200).json({ success: true, booking });
  } catch (err) { next(err); }
};

// @desc Get all bookings (admin)
exports.getAllBookings = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20, stationId } = req.query;
    const query = {};
    if (status) query.status = status;
    
    if (req.user.role === 'manager') {
      const Station = require('../models/Station');
      const managedStations = await Station.find({ manager: req.user._id }).select('_id');
      const managedIds = managedStations.map(s => s._id.toString());
      if (stationId && !managedIds.includes(stationId)) {
        return res.status(403).json({ success: false, message: 'Not authorized for this station' });
      }
      query.station = stationId ? stationId : { $in: managedIds };
    } else {
      if (stationId) query.station = stationId;
    }

    const bookings = await Booking.find(query)
      .populate('user', 'name email phone')
      .populate('station', 'name address')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    const total = await Booking.countDocuments(query);
    res.status(200).json({ success: true, bookings, total, pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

// @desc Start booking using PIN (manager/admin check-in)
exports.startBookingWithPin = async (req, res, next) => {
  try {
    const { pin } = req.body;
    const { id } = req.params; // optional ID
    if (!pin) return res.status(400).json({ success: false, message: 'PIN is required' });

    let query = { pin: pin.trim(), status: 'confirmed' };
    if (id) {
      query._id = id;
    }

    let booking = await Booking.findOne(query)
      .populate('user', 'name email')
      .populate('station', 'name address manager');

    if (!booking) {
      // Look for any status to give a descriptive error message
      let fallbackQuery = { pin: pin.trim() };
      if (id) fallbackQuery._id = id;
      
      const fallbackBooking = await Booking.findOne(fallbackQuery).sort('-createdAt');
      if (fallbackBooking) {
        if (fallbackBooking.status === 'cancelled') {
          if (fallbackBooking.cancellationReason && (
            fallbackBooking.cancellationReason.toLowerCase().includes('auto-cancelled') || 
            fallbackBooking.cancellationReason.toLowerCase().includes('no-show') || 
            fallbackBooking.cancellationReason.toLowerCase().includes('late')
          )) {
            return res.status(400).json({ success: false, message: 'Your booking has been cancelled due to being late' });
          }
          return res.status(400).json({ success: false, message: 'This booking has been cancelled' });
        }
        if (fallbackBooking.status === 'active') {
          return res.status(400).json({ success: false, message: 'This booking has already started' });
        }
        if (fallbackBooking.status === 'completed') {
          return res.status(400).json({ success: false, message: 'This booking has already completed' });
        }
        if (fallbackBooking.status === 'pending') {
          return res.status(400).json({ success: false, message: 'This booking is pending payment' });
        }
      }
      return res.status(404).json({ success: false, message: 'Invalid PIN or booking not confirmed' });
    }

    // Verify manager is authorized for this station
    if (req.user.role === 'manager' && booking.station?.manager?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to manage this station' });
    }

    booking.status = 'active';
    booking.checkedInAt = new Date();
    await booking.save({ validateBeforeSave: false });

    // Emit live slot/booking status update
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${booking.user._id}`).emit('booking-status-update', {
        bookingId: booking._id,
        status: 'active',
        message: `Your booking at ${booking.station.name} has started.`
      });
    }

    res.status(200).json({ success: true, message: 'Booking started successfully!', booking });
  } catch (err) { next(err); }
};
