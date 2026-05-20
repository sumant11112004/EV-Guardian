require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./src/config/db');
const errorHandler = require('./src/middleware/errorHandler');

// Route imports
const authRoutes = require('./src/routes/auth');
const stationRoutes = require('./src/routes/stations');
const bookingRoutes = require('./src/routes/bookings');
const paymentRoutes = require('./src/routes/payments');
const adminRoutes = require('./src/routes/admin');
const notificationRoutes = require('./src/routes/notifications');
const mechanicRoutes = require('./src/routes/mechanics');

// Connect DB
connectDB();

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:3000', methods: ['GET', 'POST'] },
});

// Make io accessible to routes
app.set('io', io);

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, message: 'Too many requests, please try again later.' });
app.use('/api/', limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/stations', stationRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/mechanics', mechanicRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'OK', timestamp: new Date().toISOString() }));

// 404
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// Error handler
app.use(errorHandler);

// Socket.IO real-time events
io.on('connection', (socket) => {
  console.log(`⚡ Socket connected: ${socket.id}`);

  socket.on('join-station', (stationId) => {
    socket.join(`station-${stationId}`);
    console.log(`Socket ${socket.id} joined station-${stationId}`);
  });

  socket.on('join-user', (userId) => {
    socket.join(`user-${userId}`);
  });

  socket.on('join-mechanic', (mechanicId) => {
    socket.join(`mechanic-${mechanicId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Simulate real-time station updates every 30s
setInterval(async () => {
  try {
    const Station = require('./src/models/Station');
    const stations = await Station.find({ status: 'active' }).limit(20).lean();
    stations.forEach(s => {
      io.to(`station-${s._id}`).emit('slot-update', {
        stationId: s._id,
        chargers: s.chargers,
        updatedAt: new Date(),
      });
    });
  } catch (e) {}
}, 30000);

// Auto-cancel bookings if user is 15 mins late (No-Show)
setInterval(async () => {
  try {
    const Booking = require('./src/models/Booking');
    const Payment = require('./src/models/Payment');
    const Notification = require('./src/models/Notification');
    const Razorpay = require('razorpay');
    
    // Find confirmed or pending bookings where startTime + 15 mins < now
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
    const noShows = await Booking.find({
      status: { $in: ['confirmed', 'pending'] },
      startTime: { $lt: fifteenMinsAgo }
    });

    if (noShows.length > 0) {
      console.log(`[Auto-cancel] Found ${noShows.length} no-show bookings past 15 minutes of start time.`);
      const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
      for (const booking of noShows) {
        try {
          console.log(`[Auto-cancel] Processing cancellation for booking: ${booking._id} (Ref: ${booking.bookingRef}, Status: ${booking.status})`);
          
          booking.status = 'cancelled';
          booking.cancellationReason = 'Auto-cancelled: No-show 15 mins past start time';
          booking.cancelledAt = new Date();

          let payment = null;
          if (booking.payment) {
            payment = await Payment.findById(booking.payment);
          } else {
            payment = await Payment.findOne({ booking: booking._id, status: 'success' });
          }

          if (payment) {
            if (payment.razorpayPaymentId) {
              const refundAmount = payment.amount * 0.90; // 10% deduction
              const refundAmountInPaise = Math.round(refundAmount * 100);
              try {
                await razorpay.payments.refund(payment.razorpayPaymentId, { amount: refundAmountInPaise });
                payment.status = 'refunded';
                payment.refundAmount = refundAmount;
                payment.refundedAt = new Date();
                await payment.save();
                
                booking.paymentStatus = 'refunded';
                console.log(`[Auto-cancel] Refunded 90% (₹${refundAmount}) for online payment ${payment.razorpayPaymentId} of booking ${booking._id}`);
              } catch (err) {
                console.error(`[Auto-cancel] Refund failed for online payment of booking ${booking._id}:`, err);
              }
            } else if (payment.method === 'cash') {
              // Cash payment voided on auto-cancellation
              payment.status = 'refunded'; // mark as refunded/cancelled in database
              payment.refundAmount = 0;
              payment.refundedAt = new Date();
              await payment.save();
              booking.paymentStatus = 'refunded';
              console.log(`[Auto-cancel] Voided unpaid cash booking payment for booking ${booking._id}`);
            }
          } else {
            booking.paymentStatus = 'failed';
          }

          await booking.save({ validateBeforeSave: false });
          
          let message = `Your booking ${booking.bookingRef} was cancelled due to a no-show.`;
          if (payment && payment.razorpayPaymentId && payment.status === 'refunded') {
            message += ` A 90% refund has been initiated to your source account.`;
          }

          await Notification.create({
            user: booking.user,
            title: 'Booking Auto-Cancelled',
            message,
            type: 'booking_cancelled',
          });

          // Emit live real-time status update to the user
          const io = app.get('io');
          if (io) {
            io.to(`user-${booking.user}`).emit('booking-status-update', {
              bookingId: booking._id,
              status: 'cancelled',
              message: `Your booking was auto-cancelled due to a no-show.`
            });

            // Emit slot updates to the station channel
            const Station = require('./src/models/Station');
            const updatedStation = await Station.findById(booking.station).lean();
            if (updatedStation) {
              // Calculate live available slots dynamically
              for (let i = 0; i < updatedStation.chargers.length; i++) {
                const activeCount = await Booking.countDocuments({
                  station: updatedStation._id,
                  chargerIndex: i,
                  status: 'active'
                });
                updatedStation.chargers[i].availableSlots = Math.max(0, updatedStation.chargers[i].totalSlots - activeCount);
              }

              io.to(`station-${booking.station}`).emit('slot-update', {
                stationId: booking.station,
                chargers: updatedStation.chargers,
                updatedAt: new Date(),
              });
            }
          }
        } catch (bookingErr) {
          console.error(`[Auto-cancel] Failed to cancel booking ${booking._id}:`, bookingErr);
        }
      }
    }
  } catch (e) {
    console.error('Auto-cancel job error:', e);
  }
}, 60000); // Check every minute

// Auto-complete ongoing active sessions once endTime has passed
setInterval(async () => {
  try {
    const Booking = require('./src/models/Booking');
    const User = require('./src/models/User');
    
    // Find active bookings where endTime <= now
    const now = new Date();
    const activeSessionsToComplete = await Booking.find({
      status: 'active',
      endTime: { $lte: now }
    });

    for (const booking of activeSessionsToComplete) {
      booking.status = 'completed';
      booking.completedAt = now;
      booking.actualCost = booking.estimatedCost;
      booking.actualEnergy = booking.estimatedEnergy;
      await booking.save({ validateBeforeSave: false });

      // Update User carbon Saved and Loyalty points
      const user = await User.findById(booking.user);
      if (user) {
        user.carbonSaved = (user.carbonSaved || 0) + (booking.carbonSaved || 0);
        // For every 100 CO2 saved, give 2 loyalty points (0.02 points per kg)
        const earnedPoints = (booking.carbonSaved || 0) * 0.02;
        user.loyaltyPoints = (user.loyaltyPoints || 0) + earnedPoints;
        await user.save();
      }

      // Emit status update socket event
      const io = app.get('io');
      if (io) {
        io.to(`user-${booking.user}`).emit('booking-status-update', {
          bookingId: booking._id,
          status: 'completed',
          message: `Your EV charging session has completed successfully! saved ${booking.carbonSaved.toFixed(1)} kg CO2.`
        });
      }
    }
  } catch (err) {
    console.error('Auto-complete job error:', err);
  }
}, 15000); // Check every 15 seconds

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 ChargePointX server running on port ${PORT} [${process.env.NODE_ENV}]`);
});

module.exports = { app, io };
