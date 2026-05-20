const Station = require('../models/Station');
const Review = require('../models/Review');

// @desc Get all stations with filters
exports.getStations = async (req, res, next) => {
  try {
    const { lat, lng, radius = 50, type, status, minRating, maxPrice, search, manager, page = 1, limit = 12 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    let stations, total;

    if (lat && lng && !search) {
      // Geo query — cannot use $or with $near in MongoDB
      const geoQuery = {
        location: {
          $near: {
            $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
            $maxDistance: parseFloat(radius) * 1000,
          },
        },
      };
      if (status && status !== 'all') geoQuery.status = status;
      else if (!status) geoQuery.status = 'active';
      if (type) geoQuery['chargers.type'] = type;
      if (minRating) geoQuery.avgRating = { $gte: parseFloat(minRating) };
      if (maxPrice) geoQuery['chargers.pricePerKwh'] = { $lte: parseFloat(maxPrice) };
      if (manager) geoQuery.manager = manager;

      const all = await Station.find(geoQuery).lean();
      total = all.length;
      stations = all.slice(skip, skip + parseInt(limit));
    } else {
      // Text-based query (no geo)
      const query = {};
      if (status && status !== 'all') query.status = status;
      else if (!status) query.status = 'active';
      if (type) query['chargers.type'] = type;
      if (minRating) query.avgRating = { $gte: parseFloat(minRating) };
      if (maxPrice) query['chargers.pricePerKwh'] = { $lte: parseFloat(maxPrice) };
      if (manager) query.manager = manager;
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { 'address.city': { $regex: search, $options: 'i' } },
          { 'address.state': { $regex: search, $options: 'i' } },
          { networkProvider: { $regex: search, $options: 'i' } },
        ];
      }

      [stations, total] = await Promise.all([
        Station.find(query).skip(skip).limit(parseInt(limit)).lean(),
        Station.countDocuments(query),
      ]);
    }

    // Calculate live available slots dynamically
    const Booking = require('../models/Booking');
    for (const station of stations) {
      if (station.chargers) {
        for (let i = 0; i < station.chargers.length; i++) {
          const activeCount = await Booking.countDocuments({
            station: station._id,
            chargerIndex: i,
            status: 'active'
          });
          station.chargers[i].availableSlots = Math.max(0, station.chargers[i].totalSlots - activeCount);
        }
      }
    }

    res.status(200).json({
      success: true,
      count: stations.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      stations,
    });
  } catch (err) { next(err); }
};


// @desc Get single station with reviews
exports.getStation = async (req, res, next) => {
  try {
    const station = await Station.findById(req.params.id).lean();
    if (!station) return res.status(404).json({ success: false, message: 'Station not found' });
    const reviews = await Review.find({ station: station._id })
      .populate('user', 'name avatar')
      .sort('-createdAt')
      .limit(10);

    if (station.chargers) {
      const Booking = require('../models/Booking');
      for (let i = 0; i < station.chargers.length; i++) {
        const activeCount = await Booking.countDocuments({
          station: station._id,
          chargerIndex: i,
          status: 'active'
        });
        station.chargers[i].availableSlots = Math.max(0, station.chargers[i].totalSlots - activeCount);
      }
    }

    res.status(200).json({ success: true, station: { ...station, reviews } });
  } catch (err) { next(err); }
};

// @desc Create station (admin) + emit real-time event
exports.createStation = async (req, res, next) => {
  try {
    const body = { ...req.body };
    if (req.files && req.files.length > 0) {
      body.images = req.files.map(f => f.path);
    }
    if (body.coordinates) {
      body.location = { type: 'Point', coordinates: JSON.parse(body.coordinates) };
      delete body.coordinates;
    }
    if (body.address && typeof body.address === 'string') body.address = JSON.parse(body.address);
    if (body.chargers && typeof body.chargers === 'string') body.chargers = JSON.parse(body.chargers);
    if (body.operatingHours && typeof body.operatingHours === 'string') body.operatingHours = JSON.parse(body.operatingHours);
    if (body.amenities && typeof body.amenities === 'string') body.amenities = JSON.parse(body.amenities);

    if (body.managerEmail) {
      const User = require('../models/User');
      const crypto = require('crypto');
      const email = body.managerEmail.toLowerCase().trim();
      let managerUser = await User.findOne({ email });
      let generatedPassword = crypto.randomBytes(4).toString('hex'); // 8 characters

      if (!managerUser) {
        managerUser = await User.create({
          name: `Station Manager`,
          email,
          password: generatedPassword,
          role: 'manager'
        });
      } else {
        managerUser.password = generatedPassword;
        if (managerUser.role === 'user') { 
          managerUser.role = 'manager'; 
        }
        await managerUser.save();
      }
      
      try {
        const sendEmail = require('../utils/sendEmail');
        let emailHtml = `<p>You've been assigned as the manager for the station: <strong>${body.name}</strong>.</p>
                         <p>Your login credentials have been updated to:</p>
                         <p>Email: <strong>${email}</strong></p>
                         <p>Password: <strong>${generatedPassword}</strong></p>`;

        await sendEmail({
          to: email,
          subject: `Manager Access: ${body.name}`,
          html: emailHtml
        });
      } catch (err) { console.error("Email failed:", err); }

      body.manager = managerUser._id;
    }

    if (body.mechanicEmail) {
      const User = require('../models/User');
      const crypto = require('crypto');
      const email = body.mechanicEmail.toLowerCase().trim();
      let mechanicUser = await User.findOne({ email });
      let generatedPassword = crypto.randomBytes(4).toString('hex'); // 8 characters

      if (!mechanicUser) {
        mechanicUser = await User.create({
          name: `Station Mechanic`,
          email,
          password: generatedPassword,
          role: 'mechanic'
        });
      } else {
        mechanicUser.password = generatedPassword;
        if (mechanicUser.role === 'user') { 
          mechanicUser.role = 'mechanic'; 
        }
        await mechanicUser.save();
      }
      
      try {
        const sendEmail = require('../utils/sendEmail');
        let emailHtml = `<p>You've been assigned as the mechanic for the station: <strong>${body.name}</strong>.</p>
                         <p>Your login credentials have been updated to:</p>
                         <p>Email: <strong>${email}</strong></p>
                         <p>Password: <strong>${generatedPassword}</strong></p>`;

        await sendEmail({
          to: email,
          subject: `Mechanic Access: ${body.name}`,
          html: emailHtml
        });
      } catch (err) { console.error("Email failed:", err); }

      body.mechanic = mechanicUser._id;
    }

    const station = await Station.create({ ...body, owner: req.user._id });

    // 🔴 Emit real-time event to all connected clients
    const io = req.app.get('io');
    if (io) {
      io.emit('station:created', { station });
    }

    res.status(201).json({ success: true, station });
  } catch (err) { next(err); }
};

// @desc Update station (admin) + emit real-time event
exports.updateStation = async (req, res, next) => {
  try {
    const body = { ...req.body };
    if (body.coordinates) {
      body.location = { type: 'Point', coordinates: JSON.parse(body.coordinates) };
      delete body.coordinates;
    }
    if (body.address && typeof body.address === 'string') body.address = JSON.parse(body.address);
    if (body.chargers && typeof body.chargers === 'string') body.chargers = JSON.parse(body.chargers);
    if (body.operatingHours && typeof body.operatingHours === 'string') body.operatingHours = JSON.parse(body.operatingHours);

    const existingStation = await Station.findById(req.params.id);
    if (!existingStation) return res.status(404).json({ success: false, message: 'Station not found' });

    if (req.user.role === 'manager' && existingStation.manager?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to manage this station' });
    }

    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(f => f.path);
      let combinedImages = [...(existingStation.images || []), ...newImages];
      if (combinedImages.length > 5) {
        // Keep only the latest 5 images (FIFO: remove from the beginning)
        combinedImages = combinedImages.slice(-5);
      }
      body.images = combinedImages;
    }

    if (body.managerEmail) {
      const User = require('../models/User');
      const crypto = require('crypto');
      const email = body.managerEmail.toLowerCase().trim();
      let managerUser = await User.findOne({ email });
      let generatedPassword = crypto.randomBytes(4).toString('hex'); // 8 characters

      if (!managerUser) {
        managerUser = await User.create({
          name: `Station Manager`,
          email,
          password: generatedPassword,
          role: 'manager'
        });
      } else {
        managerUser.password = generatedPassword;
        if (managerUser.role === 'user') { 
          managerUser.role = 'manager'; 
        }
        await managerUser.save();
      }
      
      try {
        const sendEmail = require('../utils/sendEmail');
        let emailHtml = `<p>You've been assigned as the manager for the station: <strong>${body.name || existingStation.name}</strong>.</p>
                         <p>Your login credentials have been updated to:</p>
                         <p>Email: <strong>${email}</strong></p>
                         <p>Password: <strong>${generatedPassword}</strong></p>`;

        await sendEmail({
          to: email,
          subject: `Manager Access: ${body.name || existingStation.name}`,
          html: emailHtml
        });
      } catch (err) { console.error("Email failed:", err); }

      body.manager = managerUser._id;
    }

    if (body.mechanicEmail) {
      const User = require('../models/User');
      const crypto = require('crypto');
      const email = body.mechanicEmail.toLowerCase().trim();
      let mechanicUser = await User.findOne({ email });
      let generatedPassword = crypto.randomBytes(4).toString('hex'); // 8 characters

      if (!mechanicUser) {
        mechanicUser = await User.create({
          name: `Station Mechanic`,
          email,
          password: generatedPassword,
          role: 'mechanic'
        });
      } else {
        mechanicUser.password = generatedPassword;
        if (mechanicUser.role === 'user') { 
          mechanicUser.role = 'mechanic'; 
        }
        await mechanicUser.save();
      }
      
      try {
        const sendEmail = require('../utils/sendEmail');
        let emailHtml = `<p>You've been assigned as the mechanic for the station: <strong>${body.name || existingStation.name}</strong>.</p>
                         <p>Your login credentials have been updated to:</p>
                         <p>Email: <strong>${email}</strong></p>
                         <p>Password: <strong>${generatedPassword}</strong></p>`;

        await sendEmail({
          to: email,
          subject: `Mechanic Access: ${body.name || existingStation.name}`,
          html: emailHtml
        });
      } catch (err) { console.error("Email failed:", err); }

      body.mechanic = mechanicUser._id;
    }

    const station = await Station.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true });

    // 🔴 Emit real-time event
    const io = req.app.get('io');
    if (io) {
      io.emit('station:updated', { station });
      io.to(`station-${station._id}`).emit('slot-update', {
        stationId: station._id,
        chargers: station.chargers,
        updatedAt: new Date(),
      });
    }

    res.status(200).json({ success: true, station });
  } catch (err) { next(err); }
};

// @desc Delete station (admin) + emit real-time event
exports.deleteStation = async (req, res, next) => {
  try {
    const station = await Station.findByIdAndDelete(req.params.id);
    if (!station) return res.status(404).json({ success: false, message: 'Station not found' });

    // 🔴 Emit real-time event
    const io = req.app.get('io');
    if (io) {
      io.emit('station:deleted', { stationId: req.params.id });
    }

    res.status(200).json({ success: true, message: 'Station deleted' });
  } catch (err) { next(err); }
};

// @desc Add review
exports.addReview = async (req, res, next) => {
  try {
    const { rating, comment, tags, bookingId } = req.body;
    const station = await Station.findById(req.params.id);
    if (!station) return res.status(404).json({ success: false, message: 'Station not found' });

    if (bookingId) {
      const Booking = require('../models/Booking');
      const booking = await Booking.findOne({ _id: bookingId, user: req.user._id, station: station._id });
      if (!booking) {
        return res.status(404).json({ success: false, message: 'Booking not found' });
      }
      if (booking.status !== 'completed') {
        return res.status(400).json({ success: false, message: 'You can only review a station after the booking is completed.' });
      }
      const existingBookingReview = await Review.findOne({ booking: bookingId });
      if (existingBookingReview) {
        return res.status(400).json({ success: false, message: 'You have already reviewed this booking.' });
      }
    } else {
      const Booking = require('../models/Booking');
      const hasCompleted = await Booking.findOne({ user: req.user._id, station: station._id, status: 'completed' });
      if (!hasCompleted) {
        return res.status(400).json({ success: false, message: 'You can only review a station after completing a booking.' });
      }
      const existing = await Review.findOne({ user: req.user._id, station: station._id });
      if (existing) return res.status(400).json({ success: false, message: 'Already reviewed this station' });
    }

    const review = await Review.create({
      user: req.user._id,
      station: station._id,
      booking: bookingId || undefined,
      rating,
      comment,
      tags,
      isVerified: true
    });

    const allReviews = await Review.find({ station: station._id });
    station.totalReviews = allReviews.length;
    station.avgRating = allReviews.reduce((acc, r) => acc + r.rating, 0) / allReviews.length;
    await station.save();

    const populated = await review.populate('user', 'name avatar');
    res.status(201).json({ success: true, review: populated });
  } catch (err) { next(err); }
};

// @desc Get nearby stations
exports.getNearbyStations = async (req, res, next) => {
  try {
    const { lat, lng, radius = 5 } = req.query;
    if (!lat || !lng) return res.status(400).json({ success: false, message: 'Lat and lng required' });
    const stations = await Station.find({
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseFloat(radius) * 1000,
        },
      },
      status: 'active',
    }).limit(20).lean();

    const Booking = require('../models/Booking');
    for (const station of stations) {
      if (station.chargers) {
        for (let i = 0; i < station.chargers.length; i++) {
          const activeCount = await Booking.countDocuments({
            station: station._id,
            chargerIndex: i,
            status: 'active'
          });
          station.chargers[i].availableSlots = Math.max(0, station.chargers[i].totalSlots - activeCount);
        }
      }
    }

    res.status(200).json({ success: true, count: stations.length, stations });
  } catch (err) { next(err); }
};

// @desc Get global reviews for testimonials
exports.getGlobalReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ rating: { $gte: 4 } })
      .populate('user', 'name avatar')
      .populate('station', 'name address')
      .sort('-createdAt')
      .limit(10)
      .lean();
    res.status(200).json({ success: true, reviews });
  } catch (err) { next(err); }
};
