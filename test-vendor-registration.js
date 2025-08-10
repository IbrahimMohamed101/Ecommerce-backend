const axios = require('axios');

// Test vendor registration
async function testVendorRegistration() {
    try {
        const testData = {
            email: 'testvendor@example.com',
            password: 'TestPassword123!',
            firstName: 'Test',
            lastName: 'Vendor',
            phone: '1234567890',
            vendorDetails: {
                storeName: 'Test Store',
                storeDescription: 'A test store for testing purposes',
                bankAccount: {
                    bankName: 'Test Bank',
                    accountNumber: '1234567890',
                    accountHolder: 'Test Vendor',
                    iban: 'GB82WEST12345698765432'
                }
            }
        };

        console.log('Testing vendor registration...');
        const response = await axios.post('http://localhost:3000/api/vendors/register', testData);
        
        console.log('✅ Registration successful:', response.data);
    } catch (error) {
        console.error('❌ Registration failed:', error.response?.data || error.message);
    }
}

// Run the test
testVendorRegistration();
