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
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    role: {
        type: String,
        enum: ['customer', 'admin', 'vendor'],
        default: 'customer'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    profile: {
        firstName: {
        type: String,
        trim: true
        },
        lastName: {
        type: String,
        trim: true
        },
        phone: {
        type: String,
        trim: true
        },
        avatar: {
        type: String,
        default: ''
        },
        dateOfBirth: Date,
        gender: {
        type: String,
        enum: ['male', 'female', 'other']
        }
    },
    addresses: [{
        type: {
        type: String,
        enum: ['home', 'work', 'other'],
        default: 'home'
        },
        firstName: String,
        lastName: String,
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: {
        type: String,
        default: 'Egypt'
        },
        phone: String,
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
    lastLogin: {
        type: Date,
        default: Date.now
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
    return user;
    };

    userSchema.methods.hasAddress = function() {
    return this.addresses && this.addresses.length > 0;
    };

    userSchema.methods.getDefaultAddress = function() {
    return this.addresses.find(addr => addr.isDefault) || this.addresses[0];
    };

    module.exports = mongoose.model('User', userSchema);
