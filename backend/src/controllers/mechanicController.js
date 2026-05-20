const MechanicRequest = require('../models/MechanicRequest');
const Station = require('../models/Station');

// @desc Create a new mechanic request (User)
exports.createRequest = async (req, res, next) => {
  try {
    const { stationId, problemDescription, coordinates } = req.body;
    
    if (!problemDescription || !coordinates) {
      return res.status(400).json({ success: false, message: 'Problem description and coordinates are required' });
    }

    let mechanicId = null;
    let station = null;

    if (stationId) {
      station = await Station.findById(stationId);
      if (station && station.mechanic) {
        mechanicId = station.mechanic;
      }
    }

    const mechanicRequest = await MechanicRequest.create({
      user: req.user._id,
      station: stationId || null,
      mechanic: mechanicId,
      problemDescription,
      location: { type: 'Point', coordinates },
      status: 'pending'
    });

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      if (mechanicId) {
        io.to(`mechanic-${mechanicId}`).emit('new-mechanic-request', { request: mechanicRequest });
      } else {
        io.emit('new-mechanic-request', { request: mechanicRequest });
      }
    }

    res.status(201).json({ success: true, request: mechanicRequest });
  } catch (err) { next(err); }
};

// @desc Get requests for mechanic (Mechanic)
exports.getMechanicRequests = async (req, res, next) => {
  try {
    const managedStations = await Station.find({ mechanic: req.user._id }).select('_id');
    const stationIds = managedStations.map(s => s._id);

    const requests = await MechanicRequest.find({
      $or: [
        { mechanic: req.user._id },
        { station: { $in: stationIds } },
        { mechanic: null } // allow them to see unassigned requests as fallback
      ]
    })
      .populate('user', 'name phone email')
      .populate('station', 'name address')
      .sort('-createdAt');
    res.status(200).json({ success: true, requests });
  } catch (err) { next(err); }
};

// @desc Update request status (Mechanic)
exports.updateRequestStatus = async (req, res, next) => {
  try {
    const { status, cost } = req.body;
    
    let updateData = { status };
    if (cost !== undefined) updateData.cost = cost;

    const managedStations = await Station.find({ mechanic: req.user._id }).select('_id');
    const stationIds = managedStations.map(s => s._id);

    const request = await MechanicRequest.findOneAndUpdate(
      { 
        _id: req.params.id,
        $or: [
          { mechanic: req.user._id },
          { station: { $in: stationIds } },
          { mechanic: null }
        ]
      },
      updateData,
      { new: true, runValidators: true }
    ).populate('user', 'name phone email');

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found or not assigned to you' });
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('mechanic-request-updated', { request });
    }

    res.status(200).json({ success: true, request });
  } catch (err) { next(err); }
};
