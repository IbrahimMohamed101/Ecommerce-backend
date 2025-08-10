const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const Role = require('../models/Role');
const emailService = require('./emailService');
const uploadService = require('./uploadService');
const { 
    ValidationError, 
    ConflictError, 
    NotFoundError,
    BadRequestError 
} = require('../utils/errors');
const logger = require('../utils/logger');

class VendorService {
    /**
     * Register a new vendor
     * @param {Object} vendorData - Vendor registration data
     * @returns {Object} Created vendor without sensitive data
     */
    async registerVendor(vendorData) {
        try {
            // Validate required fields
            await this.validateVendorData(vendorData);

            // Check if user already exists
            const existingUser = await User.findOne({ 
                email: vendorData.email.toLowerCase() 
            });

            if (existingUser) {
                throw new ConflictError('User with this email already exists');
            }

            // Get vendor role
            const vendorRole = await Role.findOne({ name: 'vendor' });
            if (!vendorRole) {
                throw new NotFoundError('Vendor role not found');
            }

            // Hash password
            const saltRounds = 12;
            const hashedPassword = await bcrypt.hash(vendorData.password, saltRounds);

            // Generate email verification token
            const emailVerificationToken = crypto.randomBytes(32).toString('hex');
            const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

            // Create vendor user
            const vendorUser = new User({
                email: vendorData.email.toLowerCase(),
                password: hashedPassword,
                role: vendorRole._id,
                permissions: ['vendor:basic'], // Basic vendor permissions
                profile: {
                    firstName: this.sanitizeInput(vendorData.firstName),
                    lastName: this.sanitizeInput(vendorData.lastName),
                    phone: this.sanitizePhoneNumber(vendorData.phone)
                },
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
                emailVerificationToken,
                emailVerificationExpires,
                isEmailVerified: false,
                isActive: false, // Inactive until email verification and admin approval
                supertokensId: crypto.randomUUID() // Generate unique SuperTokens ID
            });

            // Save vendor
            const savedVendor = await vendorUser.save();

            // Send verification email
            await this.sendVendorVerificationEmail(savedVendor);

            // Log vendor registration
            logger.info('New vendor registered', {
                vendorId: savedVendor._id,
                email: savedVendor.email,
                storeName: savedVendor.vendorDetails.storeName
            });

            // Return vendor data without sensitive information
            return this.sanitizeVendorResponse(savedVendor);

        } catch (error) {
            logger.error('Error registering vendor:', error);
            throw error;
        }
    }

    /**
     * Validate vendor registration data
     * @param {Object} vendorData - Vendor data to validate
     */
    async validateVendorData(vendorData) {
        const errors = [];

        // Email validation
        if (!vendorData.email || !/^\S+@\S+\.\S+$/.test(vendorData.email)) {
            errors.push('Valid email is required');
        }

        // Password validation
        if (!this.isValidPassword(vendorData.password)) {
            errors.push('Password must be at least 8 characters long and contain uppercase, lowercase, number and special character');
        }

        // Name validation
        if (!vendorData.firstName || vendorData.firstName.trim().length < 2) {
            errors.push('First name must be at least 2 characters');
        }

        if (!vendorData.lastName || vendorData.lastName.trim().length < 2) {
            errors.push('Last name must be at least 2 characters');
        }

        // Phone validation
        if (!vendorData.phone || !/^[0-9\-+\s()]{10,15}$/.test(vendorData.phone)) {
            errors.push('Valid phone number is required');
        }

        // Vendor details validation
        if (!vendorData.vendorDetails) {
            errors.push('Vendor details are required');
        } else {
            // Store name validation
            if (!vendorData.vendorDetails.storeName || vendorData.vendorDetails.storeName.trim().length < 3) {
                errors.push('Store name must be at least 3 characters');
            }

            // Store description validation
            if (!vendorData.vendorDetails.storeDescription || vendorData.vendorDetails.storeDescription.trim().length < 10) {
                errors.push('Store description must be at least 10 characters');
            }

            // Bank account validation
            if (!vendorData.vendorDetails.bankAccount) {
                errors.push('Bank account details are required');
            } else {
                const { bankName, accountNumber, accountHolder, iban } = vendorData.vendorDetails.bankAccount;
                
                if (!bankName || bankName.trim().length < 3) {
                    errors.push('Bank name is required');
                }

                if (!accountNumber || !/^[0-9]{8,20}$/.test(accountNumber)) {
                    errors.push('Valid account number is required (8-20 digits)');
                }

                if (!accountHolder || accountHolder.trim().length < 3) {
                    errors.push('Account holder name is required');
                }

                if (!iban || !/^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}$/.test(iban)) {
                    errors.push('Valid IBAN is required');
                }
            }
        }

        // Check for duplicate store name
        if (vendorData.vendorDetails?.storeName) {
            const existingStore = await User.findOne({
                'vendorDetails.storeName': new RegExp(`^${vendorData.vendorDetails.storeName}$`, 'i')
            });

            if (existingStore) {
                errors.push('Store name already exists');
            }
        }

        if (errors.length > 0) {
            throw new ValidationError('Validation failed', errors);
        }
    }

    /**
     * Validate password strength
     * @param {string} password - Password to validate
     * @returns {boolean} True if password is valid
     */
    isValidPassword(password) {
        if (!password || password.length < 8) return false;

        const hasUppercase = /[A-Z]/.test(password);
        const hasLowercase = /[a-z]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        return hasUppercase && hasLowercase && hasNumber && hasSpecialChar;
    }

    /**
     * Sanitize input to prevent XSS
     * @param {string} input - Input to sanitize
     * @returns {string} Sanitized input
     */
    sanitizeInput(input) {
        if (!input) return '';
        return input.toString().trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }

    /**
     * Sanitize and validate phone number
     * @param {string} phone - Phone number to sanitize
     * @returns {string} Sanitized phone number
     */
    sanitizePhoneNumber(phone) {
        if (!phone) return '';
        return phone.toString().replace(/[^0-9\-+\s()]/g, '').trim();
    }

    /**
     * Send verification email to vendor
     * @param {Object} vendor - Vendor user object
     */
    async sendVendorVerificationEmail(vendor) {
        try {
            const verificationUrl = `${process.env.FRONTEND_URL}/verify-vendor-email?token=${vendor.emailVerificationToken}`;
            
            await emailService.sendEmail({
                to: vendor.email,
                subject: 'Verify Your Vendor Account Email',
                template: 'vendorEmailVerification',
                data: {
                    firstName: vendor.profile.firstName,
                    storeName: vendor.vendorDetails.storeName,
                    verificationUrl,
                    expiresIn: '24 hours'
                }
            });

            // Update email verification sent flag
            vendor.emailVerificationSent = true;
            await vendor.save();

        } catch (error) {
            logger.error('Error sending vendor verification email:', error);
            throw error;
        }
    }

    /**
     * Verify vendor email
     * @param {string} token - Verification token
     * @returns {Object} Verification result
     */
    async verifyVendorEmail(token) {
        try {
            const vendor = await User.findOne({
                emailVerificationToken: token,
                emailVerificationExpires: { $gt: new Date() }
            });

            if (!vendor) {
                throw new BadRequestError('Invalid or expired verification token');
            }

            // Mark email as verified
            vendor.isEmailVerified = true;
            vendor.emailVerificationToken = undefined;
            vendor.emailVerificationExpires = undefined;
            vendor.activityLog.emailVerifiedAt = new Date();

            await vendor.save();

            // Notify admin about new vendor registration
            await this.notifyAdminNewVendor(vendor);

            logger.info('Vendor email verified', {
                vendorId: vendor._id,
                email: vendor.email
            });

            return {
                success: true,
                message: 'Email verified successfully. Your account is pending admin approval.'
            };

        } catch (error) {
            logger.error('Error verifying vendor email:', error);
            throw error;
        }
    }

    /**
     * Notify admin about new vendor registration
     * @param {Object} vendor - Vendor user object
     */
    async notifyAdminNewVendor(vendor) {
        try {
            // Get admin users
            const adminRole = await Role.findOne({ name: 'admin' });
            const admins = await User.find({ role: adminRole._id, isActive: true });

            // Send notification to admins
            for (const admin of admins) {
                await emailService.sendEmail({
                    to: admin.email,
                    subject: 'New Vendor Registration - Approval Required',
                    template: 'adminVendorNotification',
                    data: {
                        adminName: admin.profile.firstName,
                        vendorName: vendor.fullName,
                        storeName: vendor.vendorDetails.storeName,
                        vendorEmail: vendor.email,
                        registrationDate: vendor.createdAt,
                        approvalUrl: `${process.env.ADMIN_URL}/vendors/pending`
                    }
                });
            }

        } catch (error) {
            logger.error('Error notifying admin about new vendor:', error);
            // Don't throw error as this is not critical for vendor registration
        }
    }

    /**
     * Remove sensitive data from vendor response
     * @param {Object} vendor - Vendor user object
     * @returns {Object} Sanitized vendor data
     */
    sanitizeVendorResponse(vendor) {
        const vendorObj = vendor.toObject();
        
        // Remove sensitive fields
        delete vendorObj.password;
        delete vendorObj.emailVerificationToken;
        delete vendorObj.emailVerificationExpires;
        delete vendorObj.supertokensId;
        delete vendorObj.__v;
        delete vendorObj.loginAttempts;
        delete vendorObj.lockUntil;

        // Mask bank account details
        if (vendorObj.vendorDetails?.bankAccount?.accountNumber) {
            const accountNumber = vendorObj.vendorDetails.bankAccount.accountNumber;
            vendorObj.vendorDetails.bankAccount.accountNumber = 
                `****${accountNumber.slice(-4)}`;
        }

        if (vendorObj.vendorDetails?.bankAccount?.iban) {
            const iban = vendorObj.vendorDetails.bankAccount.iban;
            vendorObj.vendorDetails.bankAccount.iban = 
                `${iban.slice(0, 4)}****${iban.slice(-4)}`;
        }

        return vendorObj;
    }

    /**
     * Get vendor by ID with role verification
     * @param {string} vendorId - Vendor ID
     * @returns {Object} Vendor data
     */
    async getVendorById(vendorId) {
        try {
            const vendorRole = await Role.findOne({ name: 'vendor' });
            const vendor = await User.findOne({
                _id: vendorId,
                role: vendorRole._id
            }).populate('role');

            if (!vendor) {
                throw new NotFoundError('Vendor not found');
            }

            return this.sanitizeVendorResponse(vendor);

        } catch (error) {
            logger.error('Error getting vendor by ID:', error);
            throw error;
        }
    }
}

module.exports = new VendorService();