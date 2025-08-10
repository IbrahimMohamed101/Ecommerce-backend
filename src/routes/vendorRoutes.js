const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/validation/vendorController');
const { authorize } = require('../middleware/authMiddleware');

// Public routes
/**
 * @route   POST /vendors/register
 * @desc    Register a new vendor
 * @access  Public
 */
router.post('/register', vendorController.registerVendor);

// Admin routes (require authentication and specific permissions)
/**
 * @route   GET /vendors/pending
 * @desc    Get all pending vendors (Admin only)
 * @access  Private (Admin with 'approve_vendor' permission)
 */
router.get('/pending', authorize('approve_vendor'), vendorController.getPendingVendors);

/**
 * @route   GET /vendors/:id
 * @desc    Get vendor details (Admin only)
 * @access  Private (Admin with 'approve_vendor' permission)
 */
router.get('/:id', authorize('approve_vendor'), vendorController.getVendorDetails);

/**
 * @route   PATCH /vendors/:id/approve
 * @desc    Approve a vendor (Admin only)
 * @access  Private (Admin with 'approve_vendor' permission)
 */
router.patch('/:id/approve', authorize('approve_vendor'), vendorController.approveVendor);

/**
 * @route   PATCH /vendors/:id/reject
 * @desc    Reject a vendor (Admin only)
 * @access  Private (Admin with 'approve_vendor' permission)
 * @body    {String} reason - Reason for rejection
 */
router.patch('/:id/reject', authorize('approve_vendor'), vendorController.rejectVendor);

module.exports = router;
