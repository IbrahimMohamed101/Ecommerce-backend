const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        enum: ['superAdmin', 'admin', 'subAdmin', 'vendor', 'customer'],
        index: true
    },
    description: {
        type: String,
        default: ''
    },
    permissions: {
        type: [String],
        default: []
    },
    isDefault: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

roleSchema.pre('save', async function(next) {
    if (this.isNew && !this.permissions.length) {
        switch (this.name) {
            case 'superAdmin':
                this.permissions = ['*'];
                break;
            case 'admin':
                this.permissions = [
                    'user:read', 'user:update',
                    'product:create', 'product:update', 'product:delete',
                    'order:read', 'order:update',
                    'category:manage'
                ];
                break;
            case 'subAdmin':
                this.permissions = [
                    'user:read',
                    'product:read', 'product:update',
                    'order:read', 'order:update'
                ];
                break;
            case 'vendor':
                this.permissions = [
                    'product:create', 'product:update', 'product:delete:own',
                    'order:read:own', 'order:update:status'
                ];
                break;
            case 'customer':
                this.permissions = [
                    'order:create', 'order:read:own', 'order:cancel:own',
                    'review:create', 'review:update:own', 'review:delete:own'
                ];
                break;
        }
    }
    next();
});

roleSchema.methods.hasPermission = function(permission) {
    if (this.permissions.includes('*')) return true;
    return this.permissions.includes(permission);
};

module.exports = mongoose.model('Role', roleSchema);
