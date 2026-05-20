const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Notification = require('../models/Notification');
const nodemailer = require('nodemailer');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @desc Create Razorpay order
exports.createOrder = async (req, res, next) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId).populate('station', 'name');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const amountInPaise = Math.round(booking.estimatedCost * 100);
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: booking.bookingRef,
      payment_capture: 1,
      notes: { bookingId: booking._id.toString(), userId: req.user._id.toString() },
    });

    const payment = await Payment.create({
      user: req.user._id,
      booking: booking._id,
      amount: booking.estimatedCost,
      razorpayOrderId: order.id,
      status: 'pending',
    });

    booking.payment = payment._id;
    await booking.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: amountInPaise,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID,
      bookingRef: booking.bookingRef,
      stationName: booking.station.name,
    });
  } catch (err) { next(err); }
};

// @desc Verify payment
exports.verifyPayment = async (req, res, next) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, bookingId } = req.body;

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    const payment = await Payment.findOneAndUpdate(
      { razorpayOrderId },
      { razorpayPaymentId, razorpaySignature, status: 'success' },
      { new: true }
    );

    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      { status: 'confirmed', paymentStatus: 'paid' },
      { new: true }
    ).populate('station');

    // Send Confirmation Email
    try {
      if (process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD) {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASSWORD
          }
        });

        const mailOptions = {
          from: `"${process.env.FROM_NAME || 'EV Guardian'}" <${process.env.SMTP_EMAIL}>`,
          to: req.user.email,
          subject: `Booking Confirmed: ${booking.bookingRef}`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #8cc63f; text-align: center;">EV Guardian Booking Confirmed</h2>
              <p>Hi ${req.user.name},</p>
              <p>Your payment of <strong>₹${payment.amount}</strong> was successful. Here are your booking details:</p>
              <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
                <p style="margin: 5px 0;"><strong>Reference ID:</strong> ${booking.bookingRef}</p>
                <p style="margin: 5px 0;"><strong>Station:</strong> ${booking.station.name}</p>
                <p style="margin: 5px 0;"><strong>Address:</strong> ${booking.station.address?.street}, ${booking.station.address?.city}</p>
                <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(booking.startTime).toLocaleDateString()}</p>
                <p style="margin: 5px 0;"><strong>Time:</strong> ${new Date(booking.startTime).toLocaleTimeString()} - ${new Date(booking.endTime).toLocaleTimeString()}</p>
                <p style="margin: 5px 0;"><strong>Charger Type:</strong> ${booking.chargerType}</p>
                <p style="margin: 5px 0;"><strong>Duration:</strong> ${booking.duration} minutes</p>
              </div>
              <div style="text-align: center; margin: 30px 0; background: #f0fdf4; border: 2px dashed #8cc63f; border-radius: 12px; padding: 20px; max-width: 300px; margin: 20px auto;">
                <p style="color: #166534; font-size: 12px; text-transform: uppercase; font-weight: bold; letter-spacing: 1px; margin: 0 0 8px 0;">Your Check-In PIN</p>
                <h1 style="color: #15803d; font-family: monospace; font-size: 32px; font-weight: 900; letter-spacing: 8px; margin: 0; padding: 0;">${booking.pin || '------'}</h1>
                <p style="color: #64748b; font-size: 11px; margin: 8px 0 0 0;">Provide this 6-digit code to the station manager upon arrival to start your charging session.</p>
              </div>
              <p style="color: #64748b; font-size: 14px; text-align: center;">Thank you for driving electric with EV Guardian!</p>
            </div>
          `
        };
        await transporter.sendMail(mailOptions);
        console.log(`[Email System] Booking confirmation email containing Check-In PIN ${booking.pin} successfully sent to ${req.user.email}`);
      } else {
        console.log("Email not sent: SMTP_EMAIL or SMTP_PASSWORD not configured in .env");
      }
    } catch (emailErr) {
      console.error("Error sending email:", emailErr);
    }

    // Send SMS text message if phone number is added by user
    if (req.user.phone) {
      try {
        const smsMessage = `EV Guardian Confirmed! Booking Ref: ${booking.bookingRef}. Your 6-digit Check-In PIN is ${booking.pin}. Location: ${booking.station.name}. Time: ${new Date(booking.startTime).toLocaleTimeString()} - ${new Date(booking.endTime).toLocaleTimeString()}`;
        console.log(`[SMS Gateway] Sending SMS to ${req.user.phone}: "${smsMessage}"`);
        
        if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
          const twilio = require('twilio');
          const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
          await client.messages.create({
            body: smsMessage,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: req.user.phone
          });
          console.log(`[SMS Gateway] SMS successfully sent via Twilio API to ${req.user.phone}`);
        }
      } catch (smsErr) {
        console.error("Error sending SMS:", smsErr);
      }
    }

    await Notification.create({
      user: req.user._id,
      title: '✅ Payment Successful',
      message: `Payment of ₹${payment.amount} confirmed for booking ${booking.bookingRef}`,
      type: 'payment_success',
      link: `/bookings/${booking._id}`,
    });

    res.status(200).json({ success: true, message: 'Payment verified', payment, booking });
  } catch (err) { next(err); }
};

// @desc Pay using cash (confirm cash booking)
exports.payCash = async (req, res, next) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId).populate('station').populate('user');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    
    const isOwner = booking.user._id.toString() === req.user._id.toString();
    const isAdmin = ['admin', 'superadmin'].includes(req.user.role);
    const isStationManager = req.user.role === 'manager' && booking.station?.manager?.toString() === req.user._id.toString();

    if (!isAdmin && !isStationManager) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Booking is already ' + booking.status });
    }

    const payment = await Payment.create({
      user: booking.user._id,
      booking: booking._id,
      amount: booking.estimatedCost,
      method: 'cash',
      status: 'success',
    });

    booking.payment = payment._id;
    booking.status = 'confirmed';
    booking.paymentStatus = 'paid';
    await booking.save({ validateBeforeSave: false });

    // Send Confirmation Email
    try {
      if (process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD) {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASSWORD
          }
        });

        const mailOptions = {
          from: `"${process.env.FROM_NAME || 'EV Guardian'}" <${process.env.SMTP_EMAIL}>`,
          to: booking.user.email,
          subject: `Booking Confirmed: ${booking.bookingRef} (Cash Payment)`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #8cc63f; text-align: center;">EV Guardian Booking Confirmed</h2>
              <p>Hi ${booking.user.name},</p>
              <p>Your cash booking of <strong>₹${payment.amount}</strong> was confirmed. Please pay in cash upon arrival. Here are your booking details:</p>
              <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
                <p style="margin: 5px 0;"><strong>Reference ID:</strong> ${booking.bookingRef}</p>
                <p style="margin: 5px 0;"><strong>Station:</strong> ${booking.station.name}</p>
                <p style="margin: 5px 0;"><strong>Address:</strong> ${booking.station.address?.street}, ${booking.station.address?.city}</p>
                <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(booking.startTime).toLocaleDateString()}</p>
                <p style="margin: 5px 0;"><strong>Time:</strong> ${new Date(booking.startTime).toLocaleTimeString()} - ${new Date(booking.endTime).toLocaleTimeString()}</p>
                <p style="margin: 5px 0;"><strong>Charger Type:</strong> ${booking.chargerType}</p>
                <p style="margin: 5px 0;"><strong>Duration:</strong> ${booking.duration} minutes</p>
                <p style="margin: 5px 0;"><strong>Payment Method:</strong> Cash (Pay at Station)</p>
              </div>
              <div style="text-align: center; margin: 30px 0; background: #f0fdf4; border: 2px dashed #8cc63f; border-radius: 12px; padding: 20px; max-width: 300px; margin: 20px auto;">
                <p style="color: #166534; font-size: 12px; text-transform: uppercase; font-weight: bold; letter-spacing: 1px; margin: 0 0 8px 0;">Your Check-In PIN</p>
                <h1 style="color: #15803d; font-family: monospace; font-size: 32px; font-weight: 900; letter-spacing: 8px; margin: 0; padding: 0;">${booking.pin || '------'}</h1>
                <p style="color: #64748b; font-size: 11px; margin: 8px 0 0 0;">Provide this 6-digit code to the station manager upon arrival to start your charging session.</p>
              </div>
              <p style="color: #64748b; font-size: 14px; text-align: center;">Thank you for driving electric with EV Guardian!</p>
            </div>
          `
        };
        await transporter.sendMail(mailOptions);
        console.log(`[Email System] Cash booking confirmation email containing Check-In PIN ${booking.pin} successfully sent to ${booking.user.email}`);
      }
    } catch (emailErr) {
      console.error("Error sending email:", emailErr);
    }

    // Send SMS text message if phone number is added by user
    if (booking.user.phone) {
      try {
        const smsMessage = `EV Guardian Confirmed! Booking Ref: ${booking.bookingRef}. Pay Cash: ₹${payment.amount}. Your Check-In PIN is ${booking.pin}. Location: ${booking.station.name}.`;
        console.log(`[SMS Gateway] Sending SMS to ${booking.user.phone}: "${smsMessage}"`);
        if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
          const twilio = require('twilio');
          const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
          await client.messages.create({
            body: smsMessage,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: booking.user.phone
          });
          console.log(`[SMS Gateway] SMS successfully sent via Twilio API to ${booking.user.phone}`);
        }
      } catch (smsErr) {
        console.error("Error sending SMS:", smsErr);
      }
    }

    await Notification.create({
      user: booking.user._id,
      title: '✅ Cash Payment Confirmed',
      message: `Cash booking of ₹${payment.amount} confirmed for ${booking.bookingRef}. Please pay at station.`,
      type: 'payment_success',
      link: `/bookings/${booking._id}`,
    });

    res.status(200).json({ success: true, message: 'Cash payment confirmed', payment, booking });
  } catch (err) { next(err); }
};

// @desc Get payment history
exports.getPaymentHistory = async (req, res, next) => {
  try {
    const payments = await Payment.find({ user: req.user._id })
      .populate('booking', 'bookingRef startTime station')
      .sort('-createdAt')
      .limit(20);
    res.status(200).json({ success: true, payments });
  } catch (err) { next(err); }
};
