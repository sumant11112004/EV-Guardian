const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile, changePassword, toggleFavorite, getFavorites } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.post('/favorites/:stationId', protect, toggleFavorite);
router.get('/favorites', protect, getFavorites);

module.exports = router;
