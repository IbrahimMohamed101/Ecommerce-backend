const crypto = require('crypto');
const User = require('../models/User');
const Role = require('../models/Role');
const SuperTokensService = require('./supertokensService');
const emailService = require('./emailService');
const EmailTemplates = require('../templates/emailTemplates');
const { 
    ValidationError, 
    ConflictError, 
    NotFoundError,
    BadRequestError 
} = require('../utils/errors');
const logger = require('../utils/logger');

class VendorService {
    /**
     * Validate vendor registration data
     * @param {Object} data
     */
    async validateVendorData(data) {
        if (!data) throw new ValidationError('Registration data is missing');
        const requiredFields = ['email', 'password', 'firstName', 'lastName', 'phone', 'vendorDetails'];
        for (const field of requiredFields) {
            if (!data[field]) {
                throw new ValidationError(`The field ${field} is required`);
            }
        }
        // Basic email/phone format checks can be added here
        return true;
    }

    /**
     * Sanitize generic text input (trim & escape)
     */
    sanitizeInput(value) {
        if (!value || typeof value !== 'string') return '';
        return value.trim();
    }

    /**
     * Sanitize phone number (digits only)
     */
    sanitizePhoneNumber(value) {
        if (!value || typeof value !== 'string') return '';
        return value.replace(/[^0-9+]/g, '');
    }

    /**
     * Send verification email to vendor
     */
    async sendVendorVerificationEmail(userData) {
        try {
            // Ensure we have a Mongoose document
            const user = await User.findById(userData._id || userData.id);
            if (!user) {
                throw new Error('User not found');
            }

            // Generate a verification token if it doesn't exist
            if (!user.emailVerificationToken) {
                user.emailVerificationToken = crypto.randomBytes(32).toString('hex');
                user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
                await user.save();
            }

            const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${user.emailVerificationToken}`;
            
            // Send email with HTML content directly
            await emailService.sendEmail({
                to: user.email,
                subject: 'Vendor Email Verification',
                html: EmailTemplates.getVerificationEmailHTML(verifyUrl),
                text: `Please verify your email by clicking the following link: ${verifyUrl}`
            });

            logger.info('Verification email sent successfully', { email: user.email });
        } catch (err) {
            logger.error('Failed to send vendor verification email', {
                error: err.message,
                email: user.email,
                stack: err.stack
            });
            // Don't throw the error to prevent registration from failing just because email couldn't be sent
        }
    }

    /**
     * Remove sensitive fields before responding
     * @param {Object} user - User object (can be Mongoose document or plain object)
     */
    sanitizeVendorResponse(user) {
        // Create a shallow copy of the user object
        const vendor = user && typeof user === 'object' 
            ? (user.toObject ? user.toObject() : { ...user })
            : {};
            
        // Remove sensitive fields
        const sensitiveFields = [
            'password',
            'emailVerificationToken',
            'emailVerificationExpires',
            'supertokensId',
            '__v',
            'createdAt',
            'updatedAt'
        ];
        
        sensitiveFields.forEach(field => {
            if (vendor[field] !== undefined) {
                delete vendor[field];
            }
        });
        
        return vendor;
    }

    /**
     * Admin approves vendor store
     * @param {String} vendorId
     * @param {Object} adminUser - currently authenticated admin user
     */
    async approveVendor(vendorId, adminUser) {
        if (!await adminUser.hasPermission('approve_vendor')) {
            throw new BadRequestError('You do not have permission to approve vendors');
        }
        const vendor = await User.findById(vendorId);
        if (!vendor) throw new NotFoundError('Vendor not found');
        if (vendor.vendorDetails.storeStatus === 'approved') {
            throw new ConflictError('This store has already been approved');
        }
        vendor.vendorDetails.storeStatus = 'approved';
        vendor.isActive = true;
        vendor.vendorDetails.approvedAt = new Date();
        vendor.vendorDetails.approvedBy = adminUser._id;
        await vendor.save();
        
        // TODO: Send approval email to vendor
        
        logger.info('Vendor approved', { 
            vendorId: vendor._id, 
            admin: adminUser._id,
            email: vendor.email 
        });
        return this.sanitizeVendorResponse(vendor);
    }
    
    /**
     * Admin rejects vendor store
     * @param {String} vendorId
     * @param {Object} adminUser - currently authenticated admin user
     * @param {String} reason - Reason for rejection
     */
    async rejectVendor(vendorId, adminUser, reason) {
        if (!await adminUser.hasPermission('approve_vendor')) {
            throw new BadRequestError('You do not have permission to reject vendors');
        }
        
        const vendor = await User.findById(vendorId);
        if (!vendor) throw new NotFoundError('Vendor not found');
        
        if (vendor.vendorDetails.storeStatus === 'rejected') {
            throw new ConflictError('This store has already been rejected');
        }
        
        vendor.vendorDetails.storeStatus = 'rejected';
        vendor.vendorDetails.rejectionReason = reason;
        vendor.vendorDetails.rejectedAt = new Date();
        vendor.vendorDetails.rejectedBy = adminUser._id;
        vendor.isActive = false;
        
        await vendor.save();
        
        // TODO: Send rejection email to vendor with reason
        
        logger.info('Vendor rejected', { 
            vendorId: vendor._id, 
            admin: adminUser._id,
            email: vendor.email,
            reason: reason
        });
        
        return this.sanitizeVendorResponse(vendor);
    }
    
    /**
     * Get all pending vendors with pagination
     * @param {Object} options - Pagination options
     * @param {Number} options.page - Page number
     * @param {Number} options.limit - Items per page
     */
    async getPendingVendors({ page = 1, limit = 10 }) {
        const skip = (page - 1) * limit;
        
        const [vendors, total] = await Promise.all([
            User.find({ 
                'vendorDetails.storeStatus': 'pending',
                isEmailVerified: true
            })
            .select('-password -emailVerificationToken -emailVerificationExpires')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit)),
            
            User.countDocuments({ 
                'vendorDetails.storeStatus': 'pending',
                isEmailVerified: true 
            })
        ]);
        
        return {
            vendors: vendors.map(vendor => this.sanitizeVendorResponse(vendor)),
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        };
    }
    
    /**
     * Get vendor by ID with admin details
     * @param {String} vendorId
     */
    async getVendorById(vendorId) {
        const vendor = await User.findById(vendorId)
            .select('-password -emailVerificationToken -emailVerificationExpires')
            .populate('approvedBy rejectedBy', 'firstName lastName email')
            .lean();
            
        if (!vendor) return null;
        
        // Add additional vendor-specific data if needed
        return this.sanitizeVendorResponse(vendor);
    }
    /**\
     * Register a new vendor
     * @param {Object} vendorData - Vendor registration data
     * @returns {object} Created vendor without sensitive data
     */
    async registerVendor(vendorData) {
        try {
            await this.validateVendorData(vendorData);

            // First create user in SuperTokens and our database
            const userData = {
                email: vendorData.email.toLowerCase(),
                password: vendorData.password,
                firstName: this.sanitizeInput(vendorData.firstName),
                lastName: this.sanitizeInput(vendorData.lastName),
                phone: this.sanitizePhoneNumber(vendorData.phone),
                vendorDetails: {
                    storeName: this.sanitizeInput(vendorData.vendorDetails.storeName),
                    storeDescription: this.sanitizeInput(vendorData.vendorDetails.storeDescription),
                    storeStatus: 'pending',
                    verificationDocuments: vendorData.vendorDetails.verificationDocuments || [],
                    bankAccount: {
                        bankName: this.sanitizeInput(vendorData.vendorDetails.bankAccount?.bankName),
                        accountNumber: this.sanitizeInput(vendorData.vendorDetails.bankAccount?.accountNumber),
                        accountHolder: this.sanitizeInput(vendorData.vendorDetails.bankAccount?.accountHolder),
                        iban: this.sanitizeInput(vendorData.vendorDetails.bankAccount?.iban)
                    }
                },
                permissions: ['vendor:basic']
            };

            const savedVendor = await SuperTokensService.createUser(userData);
            
            if (!savedVendor) {
                throw new Error('Failed to create vendor');
            }

            // Convert to plain object if it's a Mongoose document
            const vendorObj = savedVendor.toObject ? savedVendor.toObject() : savedVendor;

            // Send verification email
            await this.sendVendorVerificationEmail(vendorObj);

            // Log vendor registration
            logger.info('New vendor registered', {
                vendorId: vendorObj._id || vendorObj.id,
                email: vendorObj.email,
                storeName: vendorObj.vendorDetails?.storeName
            });

            // Return vendor data without sensitive information
            return this.sanitizeVendorResponse(vendorObj);


        } catch (error) {
            logger.error('Error registering vendor:', error);
            throw error;
        }
    }
}

module.exports = new VendorService();
