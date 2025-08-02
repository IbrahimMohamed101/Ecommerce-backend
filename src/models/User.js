const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    supertokensId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Invalid email format']
    },
    role: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role',
        required: true
    },
    permissions: {
        type: [String],
        default: []
    },
    vendorDetails: {
        storeName: {
            type: String,
            trim: true,
            sparse: true
        },
        storeDescription: {
            type: String,
            trim: true
        },
        storeStatus: {
            type: String,
            enum: ['pending', 'approved', 'suspended', 'rejected'],
            default: 'pending'
        },
        verificationDocuments: [{
            type: String,
            trim: true
        }],
        storeLogo: String,
        storeBanner: String,
        taxNumber: String,
        bankAccount: {
            bankName: String,
            accountNumber: String,
            accountHolder: String,
            iban: String
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: {
        type: String,
        select: false
    },
    emailVerificationExpires: {
        type: Date,
        select: false
    },
    emailVerificationSent: {
        type: Boolean,
        default: false
    },
    lastLogin: Date,
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: Date,
    profile: {
        firstName: {
            type: String,
            trim: true,
            required: [true, 'First name is required']
        },
        lastName: {
            type: String,
            trim: true,
            required: [true, 'Last name is required']
        },
        phone: {
            type: String,
            trim: true,
            match: [/^[0-9\-+\s()]*$/, 'Invalid phone number format']
        },
        avatar: {
            type: String,
            default: '/default-avatar.png'
        },
        dateOfBirth: {
            type: Date,
            validate: {
                validator: function(v) {
                    return v < new Date();
                },
                message: 'Date of birth must be in the past'
            }
        },
        gender: {
            type: String,
            enum: ['male', 'female', 'other'],
            lowercase: true
        }
    },
    addresses: [{
        type: {
            type: String,
            enum: ['home', 'work', 'other'],
            default: 'home'
        },
        firstName: {
            type: String,
            required: [true, 'Recipient first name is required']
        },
        lastName: {
            type: String,
            required: [true, 'Recipient last name is required']
        },
        street: {
            type: String,
            required: [true, 'Street name is required']
        },
        city: {
            type: String,
            required: [true, 'City is required']
        },
        state: String,
        zipCode: String,
        country: {
            type: String,
            default: 'Egypt',
            required: true
        },
        phone: {
            type: String,
            required: [true, 'Phone number is required']
        },
        isDefault: {
            type: Boolean,
            default: false
        }
    }],
    preferences: {
        notifications: {
            email: {
                type: Boolean,
                default: true
            },
            sms: {
                type: Boolean,
                default: false
            },
            push: {
                type: Boolean,
                default: true
            }
        },
        language: {
            type: String,
            enum: ['ar', 'en'],
            default: 'ar'
        },
        currency: {
            type: String,
            enum: ['EGP', 'USD', 'EUR'],
            default: 'EGP'
        }
    },
    thirdParty: {
        provider: {
            type: String,
            enum: ['google', 'facebook']
        },
        providerId: String
    },
    activityLog: {
        lastSeen: {
            type: Date,
            default: Date.now
        },
        emailVerifiedAt: Date,
        passwordChangedAt: Date
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual
userSchema.virtual('fullName').get(function() {
    return `${this.profile.firstName} ${this.profile.lastName}`.trim();
});

// Index
userSchema.index({ email: 1 });
userSchema.index({ supertokensId: 1 });
userSchema.index({ 'profile.firstName': 1, 'profile.lastName': 1 });

// Middleware
userSchema.pre('save', function(next) {
    if (this.isModified('profile.firstName') || this.isModified('profile.lastName')) {
        this.updatedAt = Date.now();
    }
    next();
});

// Methods
userSchema.methods.toJSON = function() {
    const user = this.toObject();
    delete user.supertokensId;
    delete user.__v;
    delete user.loginAttempts;
    delete user.lockUntil;
    return user;
};

userSchema.methods.hasAddress = function() {
    return this.addresses.length > 0;
};

userSchema.methods.getDefaultAddress = function() {
    return this.addresses.find(addr => addr.isDefault) || this.addresses[0];
};

userSchema.methods.hasPermission = async function(permission) {
    // If the user has direct permission
    if (this.permissions && this.permissions.includes('*')) return true;
    if (this.permissions && this.permissions.includes(permission)) return true;

    // Get user role and check its permissions
    const Role = mongoose.model('Role');
    const role = await Role.findById(this.role);

    if (!role) return false;
    return role.hasPermission(permission);
};

userSchema.methods.updateLastLogin = async function() {
    this.lastLogin = new Date();
    this.loginAttempts = 0;
    this.lockUntil = undefined;
    return this.save();
};

userSchema.methods.incrementLoginAttempts = async function() {
    if (this.lockUntil && this.lockUntil > Date.now()) {
        return; // Account is already locked
    }

    this.loginAttempts += 1;

    if (this.loginAttempts >= 5) {
        // Lock account for 1 hour
        this.lockUntil = Date.now() + 3600000; // 1 hour
    }

    return this.save();
};

module.exports = mongoose.model('User', userSchema);