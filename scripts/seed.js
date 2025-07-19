    const mongoose = require('mongoose');
    const User = require('../src/models/User');
    const config = require('../src/config/environment');

    const seedUsers = async () => {
    try {
        await mongoose.connect(config.mongodb.uri);
        
        const testUser = new User({
        supertokensId: 'test-user-id',
        email: 'test@example.com',
        role: 'customer',
        isActive: true,
        isEmailVerified: true,
        profile: {
            firstName: 'Ahmed',
            lastName: 'Mohamed',
            phone: '+201234567890'
        },
        addresses: [{
            type: 'home',
            firstName: 'Ahmed',
            lastName: 'Mohamed',
            street: '123 Main St',
            city: 'Cairo',
            state: 'Cairo',
            zipCode: '12345',
            country: 'Egypt',
            phone: '+201234567890',
            isDefault: true
        }]
        });

        await testUser.save();
        console.log('Test user created successfully');
        
        mongoose.connection.close();
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
    };

    seedUsers();
