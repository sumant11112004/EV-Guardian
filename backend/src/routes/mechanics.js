const express = require('express');
const router = express.Router();
const {
  createRequest, getMechanicRequests, updateRequestStatus
} = require('../controllers/mechanicController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('user'), createRequest);
router.get('/', protect, authorize('mechanic'), getMechanicRequests);
router.put('/:id/status', protect, authorize('mechanic'), updateRequestStatus);

module.exports = router;
