const User = require('../models/User');
const crypto = require('crypto');
const { sendTokenResponse } = require('../utils/generateToken');

// @desc Register user
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ success: false, message: 'Email already registered' });
    const user = await User.create({ name, email, password, phone });
    sendTokenResponse(user, 201, res);
  } catch (err) { next(err); }
};

// @desc Login user
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    sendTokenResponse(user, 200, res);
  } catch (err) { next(err); }
};

// @desc Get current user
exports.getMe = async (req, res) => {
  res.status(200).json({ success: true, user: req.user });
};

// @desc Update profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, vehicle, notificationPreferences } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, vehicle, notificationPreferences },
      { new: true, runValidators: true }
    );
    res.status(200).json({ success: true, user });
  } catch (err) { next(err); }
};

// @desc Change password
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.matchPassword(currentPassword))) {
      return res.status(401).json({ success: false, message: 'Current password incorrect' });
    }
    user.password = newPassword;
    await user.save();
    sendTokenResponse(user, 200, res);
  } catch (err) { next(err); }
};

// @desc Add/remove favorite station
exports.toggleFavorite = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const stationId = req.params.stationId;
    const isFav = user.favoriteStations.includes(stationId);
    if (isFav) {
      user.favoriteStations = user.favoriteStations.filter(id => id.toString() !== stationId);
    } else {
      user.favoriteStations.push(stationId);
    }
    await user.save();
    res.status(200).json({ success: true, isFavorite: !isFav, favorites: user.favoriteStations });
  } catch (err) { next(err); }
};

// @desc Get favorite stations
exports.getFavorites = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('favoriteStations');
    res.status(200).json({ success: true, stations: user.favoriteStations });
  } catch (err) { next(err); }
};
