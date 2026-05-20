const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 50 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, minlength: 6, select: false },
  phone: { type: String, trim: true },
  avatar: { type: String, default: '' },
  role: { type: String, enum: ['user', 'admin', 'superadmin', 'manager', 'mechanic'], default: 'user' },
  googleId: { type: String },
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  wallet: { type: Number, default: 0 },
  loyaltyPoints: { type: Number, default: 0 },
  favoriteStations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Station' }],
  vehicle: {
    make: String,
    model: String,
    year: Number,
    connectorType: { type: String, enum: ['CCS', 'CHAdeMO', 'Type2', 'Type1', 'GB/T'] },
    batteryCapacity: Number,
  },
  notificationPreferences: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    push: { type: Boolean, default: true },
    bookingReminders: { type: Boolean, default: true },
    slotStatus: { type: Boolean, default: true },
    paymentUpdates: { type: Boolean, default: true },
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  carbonSaved: { type: Number, default: 0 },
  totalEnergy: { type: Number, default: 0 },
}, { timestamps: true });

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
