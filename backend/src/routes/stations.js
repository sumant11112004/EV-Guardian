const express = require('express');
const router = express.Router();
const {
  getStations, getStation, createStation, updateStation, deleteStation, addReview, getNearbyStations, getGlobalReviews
} = require('../controllers/stationController');
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

router.get('/', getStations);
router.get('/reviews/all', getGlobalReviews);
router.get('/nearby', getNearbyStations);
router.get('/:id', getStation);
router.post('/', protect, authorize('admin', 'superadmin'), upload.array('images', 5), createStation);
router.put('/:id', protect, authorize('admin', 'superadmin', 'manager'), upload.array('images', 5), updateStation);
router.delete('/:id', protect, authorize('admin', 'superadmin'), deleteStation);
router.post('/:id/reviews', protect, addReview);

module.exports = router;
