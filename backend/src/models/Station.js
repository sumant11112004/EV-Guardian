const mongoose = require('mongoose');

const stationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, maxlength: 500 },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, default: 'India' },
  },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }, // [lng, lat]
  },
  images: [{ type: String }],
  status: { type: String, enum: ['active', 'inactive', 'maintenance'], default: 'active' },
  chargers: [{
    type: { type: String, enum: ['AC Level 1', 'AC Level 2', 'DC Fast', 'CCS', 'CHAdeMO', 'Type2'], required: true },
    power: { type: Number, required: true }, // kW
    connectorType: { type: String, required: true },
    totalSlots: { type: Number, default: 1 },
    availableSlots: { type: Number, default: 1 },
    pricePerKwh: { type: Number, required: true },
    pricePerMinute: { type: Number, default: 0 },
  }],
  amenities: [{ type: String }],
  operatingHours: {
    is24x7: { type: Boolean, default: true },
    open: { type: String, default: '00:00' },
    close: { type: String, default: '23:59' },
  },
  totalRatings: { type: Number, default: 0 },
  avgRating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  mechanic: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  networkProvider: { type: String, default: 'ChargePointX' },
  isVerified: { type: Boolean, default: false },
  totalRevenue: { type: Number, default: 0 },
  totalSessions: { type: Number, default: 0 },
  totalEnergyDelivered: { type: Number, default: 0 },
  waitTime: { type: Number, default: 0 }, // minutes
}, { timestamps: true });

stationSchema.index({ location: '2dsphere' });
stationSchema.index({ 'address.city': 1 });
stationSchema.index({ status: 1 });

module.exports = mongoose.model('Station', stationSchema);
