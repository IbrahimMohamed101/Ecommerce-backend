const Role = require('../models/Role');

const defaultRoles = [
    { 
        name: 'superAdmin',
        description: 'Has all permissions',
        isDefault: true,
        permissions: ['*']
    },
    { 
        name: 'admin',
        description: 'System administrator',
        isDefault: true,
        permissions: [
            'user:read', 'user:update',
            'product:create', 'product:update', 'product:delete',
            'order:read', 'order:update',
            'category:manage'
        ]
    },
    { 
        name: 'subAdmin',
        description: 'Assistant administrator',
        isDefault: true,
        permissions: [
            'user:read',
            'product:read', 'product:update',
            'order:read', 'order:update'
        ]
    },
    { 
        name: 'vendor',
        description: 'Merchant',
        isDefault: true,
        permissions: [
            'product:create', 'product:update', 'product:delete:own',
            'order:read:own', 'order:update:status'
        ]
    },
    { 
        name: 'customer',
        description: 'Customer',
        isDefault: true,
        permissions: [
            'order:create', 'order:read:own', 'order:cancel:own',
            'review:create', 'review:update:own', 'review:delete:own'
        ]
    }
];

async function initializeRoles() {
    for (const roleData of defaultRoles) {
        await Role.findOneAndUpdate(
            { name: roleData.name },
            { $setOnInsert: roleData },
            { upsert: true, new: true }
        );
    }
    console.log('✅ Roles initialized successfully');
}

module.exports = initializeRoles;