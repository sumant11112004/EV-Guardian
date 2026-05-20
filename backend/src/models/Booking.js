const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  station: { type: mongoose.Schema.Types.ObjectId, ref: 'Station', required: true },
  chargerIndex: { type: Number, required: true },
  chargerType: { type: String, required: true },
  vehicleNumber: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  duration: { type: Number, required: true }, // minutes
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'active', 'completed', 'cancelled', 'no_show'],
    default: 'pending',
  },
  estimatedEnergy: { type: Number, default: 0 }, // kWh
  actualEnergy: { type: Number, default: 0 },
  pricePerKwh: { type: Number, required: true },
  estimatedCost: { type: Number, required: true },
  actualCost: { type: Number, default: 0 },
  payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded', 'failed'], default: 'pending' },
  qrCode: { type: String },
  pin: { type: String },
  bookingRef: { type: String, unique: true },
  notes: { type: String, maxlength: 300 },
  cancellationReason: { type: String },
  cancelledAt: { type: Date },
  checkedInAt: { type: Date },
  completedAt: { type: Date },
  carbonSaved: { type: Number, default: 0 },
}, { timestamps: true });

bookingSchema.index({ user: 1, status: 1 });
bookingSchema.index({ station: 1, startTime: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
