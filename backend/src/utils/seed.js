const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Station = require('../models/Station');
const connectDB = require('../config/db');

const DEMO_STATIONS = [
  {
    name: 'Tata Power EV Hub – Koramangala',
    description: 'Premium fast-charging hub with 8 DC chargers and lounge area.',
    address: { street: '1st Block, 80 Feet Road', city: 'Bengaluru', state: 'Karnataka', pincode: '560034' },
    location: { type: 'Point', coordinates: [77.6167, 12.9352] },
    chargers: [
      { type: 'DC Fast', connectorType: 'CCS', power: 60, totalSlots: 4, availableSlots: 3, pricePerKwh: 18 },
      { type: 'AC Level 2', connectorType: 'Type2', power: 22, totalSlots: 4, availableSlots: 4, pricePerKwh: 12 },
    ],
    amenities: ['WiFi', 'Café', 'Restrooms', 'Parking', 'CCTV'],
    operatingHours: { is24x7: true },
    status: 'active',
    avgRating: 4.7,
    totalReviews: 48,
    networkProvider: 'Tata Power',
    isVerified: true,
  },
  {
    name: 'Ather Grid – Indiranagar',
    description: 'Ather-compatible fast charging with multiple connector types.',
    address: { street: '100 Feet Road, HAL 2nd Stage', city: 'Bengaluru', state: 'Karnataka', pincode: '560038' },
    location: { type: 'Point', coordinates: [77.6413, 12.9784] },
    chargers: [
      { type: 'DC Fast', connectorType: 'CCS', power: 100, totalSlots: 2, availableSlots: 1, pricePerKwh: 22 },
      { type: 'DC Fast', connectorType: 'CHAdeMO', power: 50, totalSlots: 2, availableSlots: 2, pricePerKwh: 20 },
    ],
    amenities: ['Restrooms', 'Parking', 'Security Guard'],
    operatingHours: { is24x7: true },
    status: 'active',
    avgRating: 4.5,
    totalReviews: 31,
    networkProvider: 'Ather Energy',
    isVerified: true,
  },
  {
    name: 'BESCOM Green Charging – MG Road',
    description: 'Government-operated charging station with AC chargers.',
    address: { street: 'Cunningham Road', city: 'Bengaluru', state: 'Karnataka', pincode: '560052' },
    location: { type: 'Point', coordinates: [77.6050, 12.9767] },
    chargers: [
      { type: 'AC Level 2', connectorType: 'Type2', power: 7.4, totalSlots: 6, availableSlots: 6, pricePerKwh: 8 },
    ],
    amenities: ['Parking', 'CCTV'],
    operatingHours: { is24x7: false, open: '06:00', close: '22:00' },
    status: 'active',
    avgRating: 3.9,
    totalReviews: 22,
    networkProvider: 'BESCOM',
    isVerified: true,
  },
  {
    name: 'ChargePointX Station – Whitefield',
    description: 'Our flagship station with the latest 150kW ultra-fast chargers.',
    address: { street: 'EPIP Zone, Whitefield', city: 'Bengaluru', state: 'Karnataka', pincode: '560066' },
    location: { type: 'Point', coordinates: [77.7480, 12.9716] },
    chargers: [
      { type: 'DC Fast', connectorType: 'CCS', power: 150, totalSlots: 3, availableSlots: 2, pricePerKwh: 25 },
      { type: 'AC Level 2', connectorType: 'Type2', power: 22, totalSlots: 5, availableSlots: 5, pricePerKwh: 13 },
      { type: 'DC Fast', connectorType: 'CHAdeMO', power: 50, totalSlots: 2, availableSlots: 0, pricePerKwh: 21 },
    ],
    amenities: ['WiFi', 'Café', 'Restrooms', 'Parking', 'EV Accessories Shop', 'Lounger'],
    operatingHours: { is24x7: true },
    status: 'active',
    avgRating: 4.9,
    totalReviews: 67,
    networkProvider: 'ChargePointX',
    isVerified: true,
  },
  {
    name: 'Charge Zone – Andheri West',
    description: 'Urban fast charger hub in the heart of Mumbai.',
    address: { street: 'Versova Road, Andheri West', city: 'Mumbai', state: 'Maharashtra', pincode: '400058' },
    location: { type: 'Point', coordinates: [72.8295, 19.1341] },
    chargers: [
      { type: 'DC Fast', connectorType: 'CCS', power: 60, totalSlots: 4, availableSlots: 4, pricePerKwh: 19 },
      { type: 'AC Level 2', connectorType: 'Type2', power: 22, totalSlots: 4, availableSlots: 3, pricePerKwh: 14 },
    ],
    amenities: ['WiFi', 'Parking', 'Restrooms'],
    operatingHours: { is24x7: true },
    status: 'active',
    avgRating: 4.4,
    totalReviews: 39,
    networkProvider: 'Charge Zone',
    isVerified: true,
  },
  {
    name: 'Tata Power – Bandra BKC',
    description: 'Premium charging at Bandra Kurla Complex.',
    address: { street: 'G Block, BKC', city: 'Mumbai', state: 'Maharashtra', pincode: '400051' },
    location: { type: 'Point', coordinates: [72.8656, 19.0596] },
    chargers: [
      { type: 'DC Fast', connectorType: 'CCS', power: 100, totalSlots: 6, availableSlots: 5, pricePerKwh: 20 },
    ],
    amenities: ['Security', 'Parking', 'CCTV', 'WiFi'],
    operatingHours: { is24x7: true },
    status: 'active',
    avgRating: 4.6,
    totalReviews: 54,
    networkProvider: 'Tata Power',
    isVerified: true,
  },
  {
    name: 'EV Point – Cyber Hub Gurugram',
    description: 'Charging at the iconic Cyber Hub entertainment complex.',
    address: { street: 'DLF Cyber Hub', city: 'Gurugram', state: 'Haryana', pincode: '122002' },
    location: { type: 'Point', coordinates: [77.0878, 28.4950] },
    chargers: [
      { type: 'DC Fast', connectorType: 'CCS', power: 60, totalSlots: 4, availableSlots: 2, pricePerKwh: 17 },
      { type: 'AC Level 2', connectorType: 'Type2', power: 22, totalSlots: 6, availableSlots: 6, pricePerKwh: 11 },
    ],
    amenities: ['Mall Access', 'WiFi', 'Food Court', 'Parking'],
    operatingHours: { is24x7: false, open: '09:00', close: '23:00' },
    status: 'active',
    avgRating: 4.3,
    totalReviews: 28,
    networkProvider: 'ChargePointX',
    isVerified: true,
  },
  {
    name: 'Magenta ChargeGrid – T Nagar',
    description: 'Popular urban charger in Chennai\'s busiest shopping district.',
    address: { street: 'Usman Road, T Nagar', city: 'Chennai', state: 'Tamil Nadu', pincode: '600017' },
    location: { type: 'Point', coordinates: [80.2199, 13.0418] },
    chargers: [
      { type: 'DC Fast', connectorType: 'CCS', power: 30, totalSlots: 3, availableSlots: 3, pricePerKwh: 16 },
      { type: 'AC Level 2', connectorType: 'Type2', power: 7.4, totalSlots: 4, availableSlots: 2, pricePerKwh: 10 },
    ],
    amenities: ['Parking', 'CCTV', 'Restrooms'],
    operatingHours: { is24x7: false, open: '07:00', close: '22:00' },
    status: 'active',
    avgRating: 4.1,
    totalReviews: 19,
    networkProvider: 'Magenta',
    isVerified: true,
  },
];

async function seed() {
  try {
    await connectDB();
    console.log('🌱 Starting seed...\n');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Station.deleteMany({}),
    ]);
    console.log('🗑️  Cleared existing data');

    // Create admin user
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@chargepointx.in',
      password: 'Admin@123',
      role: 'admin',
      isVerified: true,
      isActive: true,
    });
    console.log(`✅ Admin created: admin@chargepointx.in / Admin@123`);

    // Create demo user
    const user = await User.create({
      name: 'Arjun Sharma',
      email: 'arjun@demo.com',
      password: 'Demo@123',
      role: 'user',
      isVerified: true,
      isActive: true,
      phone: '+91 98765 43210',
      loyaltyPoints: 250,
      wallet: 500,
      vehicle: {
        make: 'Tata',
        model: 'Nexon EV Max',
        year: 2023,
        connectorType: 'CCS',
        batteryCapacity: 40.5,
      },
    });
    console.log(`✅ Demo user created: arjun@demo.com / Demo@123`);

    // Create stations
    const stations = await Station.insertMany(DEMO_STATIONS);
    console.log(`✅ Created ${stations.length} demo charging stations`);

    console.log('\n🚀 Seed complete! Accounts:');
    console.log('   Admin  → admin@chargepointx.in  / Admin@123');
    console.log('   User   → arjun@demo.com         / Demo@123');
    console.log('\n🌐 Start the servers:');
    console.log('   Backend  → cd backend && npm run dev');
    console.log('   Frontend → cd frontend && npm run dev');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
}

seed();
