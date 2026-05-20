const User = require('../models/User');
const Station = require('../models/Station');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const MaintenanceLog = require('../models/MaintenanceLog');

// @desc Admin dashboard stats
exports.getDashboardStats = async (req, res, next) => {
  try {
    let stationQuery = {};
    let bookingQuery = {};
    let paymentMatch = { status: 'success' };
    
    if (req.user.role === 'manager') {
      const managedStations = await Station.find({ manager: req.user._id }).select('_id');
      const managedIds = managedStations.map(s => s._id);
      stationQuery = { _id: { $in: managedIds } };
      bookingQuery = { station: { $in: managedIds } };
      
      const bookingsForPayments = await Booking.find(bookingQuery).select('_id');
      paymentMatch.booking = { $in: bookingsForPayments.map(b => b._id) };
    }

    const [
      totalUsers, totalStations, totalBookings, totalRevenue,
      activeBookings, pendingBookings, stationsUnderMaintenance,
      recentBookings, recentPayments,
    ] = await Promise.all([
      req.user.role === 'manager' ? 0 : User.countDocuments({ role: 'user' }),
      Station.countDocuments(stationQuery),
      Booking.countDocuments(bookingQuery),
      Payment.aggregate([
        { $match: { ...paymentMatch, status: { $in: ['success', 'refunded'] } } },
        { $lookup: { from: 'bookings', localField: 'booking', foreignField: '_id', as: 'bookingDoc' } },
        { $unwind: '$bookingDoc' },
        {
          $project: {
            revenue: {
              $cond: {
                if: { $eq: ['$bookingDoc.status', 'completed'] },
                then: '$amount',
                else: {
                  $cond: {
                    if: {
                      $and: [
                        { $in: ['$bookingDoc.status', ['confirmed', 'active']] },
                        { $eq: ['$method', 'cash'] }
                      ]
                    },
                    then: '$amount',
                    else: {
                      $cond: {
                        if: { $eq: ['$bookingDoc.status', 'cancelled'] },
                        then: {
                          $cond: {
                            if: { $regexMatch: { input: { $ifNull: ['$bookingDoc.cancellationReason', ''] }, regex: /Auto-cancelled/i } },
                            then: { $multiply: ['$amount', 0.10] },
                            else: { $multiply: ['$amount', 0.05] }
                          }
                        },
                        else: 0
                      }
                    }
                  }
                }
              }
            }
          }
        },
        { $group: { _id: null, total: { $sum: '$revenue' } } }
      ]),
      Booking.countDocuments({ ...bookingQuery, status: 'active' }),
      Booking.countDocuments({ ...bookingQuery, status: 'pending' }),
      Station.countDocuments({ ...stationQuery, status: 'maintenance' }),
      Booking.find(bookingQuery).populate('user', 'name email').populate('station', 'name').sort('-createdAt').limit(5),
      Payment.find(paymentMatch).populate('user', 'name').sort('-createdAt').limit(5),
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers, totalStations, totalBookings,
        totalRevenue: totalRevenue[0]?.total || 0,
        activeBookings, pendingBookings, stationsUnderMaintenance,
      },
      recentBookings,
      recentPayments,
    });
  } catch (err) { next(err); }
};

// @desc Revenue analytics
exports.getRevenueAnalytics = async (req, res, next) => {
  try {
    const { period = '30' } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    let bookingQuery = { status: { $in: ['completed', 'confirmed'] }, createdAt: { $gte: daysAgo } };
    let paymentMatch = { status: 'success', createdAt: { $gte: daysAgo } };
    let peakHoursQuery = { createdAt: { $gte: daysAgo } };
    let managedIds = [];

    if (req.user.role === 'manager') {
      const managedStations = await Station.find({ manager: req.user._id }).select('_id');
      managedIds = managedStations.map(s => s._id);
      bookingQuery.station = { $in: managedIds };
      peakHoursQuery.station = { $in: managedIds };

      const bookingsForPayments = await Booking.find({ station: { $in: managedIds } }).select('_id');
      paymentMatch.booking = { $in: bookingsForPayments.map(b => b._id) };
    }

    const daily = await Payment.aggregate([
      { $match: { ...paymentMatch, status: { $in: ['success', 'refunded'] } } },
      { $lookup: { from: 'bookings', localField: 'booking', foreignField: '_id', as: 'bookingDoc' } },
      { $unwind: '$bookingDoc' },
      {
        $project: {
          createdAt: 1,
          revenue: {
            $cond: {
              if: { $eq: ['$bookingDoc.status', 'completed'] },
              then: '$amount',
              else: {
                $cond: {
                  if: {
                    $and: [
                      { $in: ['$bookingDoc.status', ['confirmed', 'active']] },
                      { $eq: ['$method', 'cash'] }
                    ]
                  },
                  then: '$amount',
                  else: {
                    $cond: {
                      if: { $eq: ['$bookingDoc.status', 'cancelled'] },
                      then: {
                        $cond: {
                          if: { $regexMatch: { input: { $ifNull: ['$bookingDoc.cancellationReason', ''] }, regex: /Auto-cancelled/i } },
                          then: { $multiply: ['$amount', 0.10] },
                          else: { $multiply: ['$amount', 0.05] }
                        }
                      },
                      else: 0
                    }
                  }
                }
              }
            }
          }
        }
      },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$revenue' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    let bookingMatch = {
      status: { $in: ['completed', 'confirmed', 'active', 'cancelled'] },
      createdAt: { $gte: daysAgo }
    };
    if (req.user.role === 'manager') {
      bookingMatch.station = { $in: managedIds };
    }

    const byStation = await Booking.aggregate([
      { $match: bookingMatch },
      { $lookup: { from: 'payments', localField: 'payment', foreignField: '_id', as: 'paymentDoc' } },
      { $unwind: { path: '$paymentDoc', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          station: 1,
          revenue: {
            $cond: {
              if: { $eq: ['$status', 'completed'] },
              then: '$estimatedCost',
              else: {
                $cond: {
                  if: {
                    $and: [
                      { $in: ['$status', ['confirmed', 'active']] },
                      { $eq: ['$paymentDoc.method', 'cash'] }
                    ]
                  },
                  then: '$estimatedCost',
                  else: {
                    $cond: {
                      if: { $eq: ['$status', 'cancelled'] },
                      then: {
                        $cond: {
                          if: { $regexMatch: { input: { $ifNull: ['$cancellationReason', ''] }, regex: /Auto-cancelled/i } },
                          then: { $multiply: ['$estimatedCost', 0.10] },
                          else: { $multiply: ['$estimatedCost', 0.05] }
                        }
                      },
                      else: 0
                    }
                  }
                }
              }
            }
          }
        }
      },
      { $group: { _id: '$station', count: { $sum: 1 }, revenue: { $sum: '$revenue' } } },
      { $lookup: { from: 'stations', localField: '_id', foreignField: '_id', as: 'station' } },
      { $unwind: '$station' },
      { $project: { name: '$station.name', count: 1, revenue: 1 } },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
    ]);

    const peakHours = await Booking.aggregate([
      { $match: peakHoursQuery },
      { $group: { _id: { $hour: '$startTime' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({ success: true, daily, byStation, peakHours });
  } catch (err) { next(err); }
};

// @desc Get all users (admin)
exports.getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = { role: 'user' };
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    const users = await User.find(query).sort('-createdAt').skip((page - 1) * limit).limit(parseInt(limit));
    const total = await User.countDocuments(query);
    res.status(200).json({ success: true, users, total, pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

// @desc Toggle user active status (admin)
exports.toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.status(200).json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}`, user });
  } catch (err) { next(err); }
};

// @desc Create maintenance log
exports.createMaintenanceLog = async (req, res, next) => {
  try {
    const log = await MaintenanceLog.create({ ...req.body, reportedBy: req.user._id });
    if (req.body.markMaintenance) {
      await Station.findByIdAndUpdate(req.body.station, { status: 'maintenance' });
    }
    res.status(201).json({ success: true, log });
  } catch (err) { next(err); }
};

// @desc Get maintenance logs
exports.getMaintenanceLogs = async (req, res, next) => {
  try {
    const logs = await MaintenanceLog.find(req.query.stationId ? { station: req.query.stationId } : {})
      .populate('station', 'name address')
      .populate('reportedBy', 'name')
      .sort('-createdAt')
      .limit(50);
    res.status(200).json({ success: true, logs });
  } catch (err) { next(err); }
};
