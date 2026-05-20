const mongoose = require('mongoose');

const mechanicRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  station: { type: mongoose.Schema.Types.ObjectId, ref: 'Station' },
  mechanic: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  problemDescription: { type: String, required: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }, // [lng, lat]
  },
  status: { type: String, enum: ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'], default: 'pending' },
  cost: { type: Number, default: 0 },
}, { timestamps: true });

mechanicRequestSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('MechanicRequest', mechanicRequestSchema);
