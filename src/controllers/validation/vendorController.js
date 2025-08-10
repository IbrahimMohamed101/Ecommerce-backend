const vendorService = require('../../services/vendorRegistrationService');
const { NotFoundError } = require('../../utils/errors');

class VendorController {
    /**
     * Register a new vendor
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    async registerVendor(req, res, next) {
        try {
            const vendor = await vendorService.registerVendor(req.body);
            res.status(201).json({
                success: true,
                message: 'Vendor registered successfully. Please check your email to verify your account.',
                data: vendor
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * Approve a vendor (Admin only)
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    async approveVendor(req, res, next) {
        try {
            const vendor = await vendorService.approveVendor(req.params.id, req.user);
            res.json({
                success: true,
                message: 'Vendor approved successfully',
                data: vendor
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * Reject a vendor (Admin only)
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    async rejectVendor(req, res, next) {
        try {
            const { reason } = req.body;
            const vendor = await vendorService.rejectVendor(req.params.id, req.user, reason);
            res.json({
                success: true,
                message: 'Vendor rejected successfully',
                data: vendor
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * Get all pending vendors (Admin only)
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    async getPendingVendors(req, res, next) {
        try {
            const { page = 1, limit = 10 } = req.query;
            const result = await vendorService.getPendingVendors({
                page: parseInt(page),
                limit: parseInt(limit)
            });
            res.json({
                success: true,
                data: result
            });
        } catch (err) {
            next(err);
        }
    }

    /**
     * Get vendor details (Admin only)
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    async getVendorDetails(req, res, next) {
        try {
            const vendor = await vendorService.getVendorById(req.params.id);
            if (!vendor) {
                throw new NotFoundError('Vendor not found');
            }
            res.json({
                success: true,
                data: vendor
            });
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new VendorController();
