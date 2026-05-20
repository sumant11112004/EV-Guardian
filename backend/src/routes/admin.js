const express = require('express');
const router = express.Router();
const { getDashboardStats, getRevenueAnalytics, getAllUsers, toggleUserStatus, createMaintenanceLog, getMaintenanceLogs } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

const adminOnly = [protect, authorize('admin', 'superadmin')];
const managerAndAdmin = [protect, authorize('admin', 'superadmin', 'manager')];

router.get('/stats', ...managerAndAdmin, getDashboardStats);
router.get('/analytics/revenue', ...managerAndAdmin, getRevenueAnalytics);
router.get('/users', ...adminOnly, getAllUsers);
router.put('/users/:id/toggle', ...adminOnly, toggleUserStatus);
router.post('/maintenance', ...managerAndAdmin, createMaintenanceLog);
router.get('/maintenance', ...managerAndAdmin, getMaintenanceLogs);

module.exports = router;
