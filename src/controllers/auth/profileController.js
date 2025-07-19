    const User = require('../../models/User');
    const { validationResult } = require('express-validator');

    class ProfileController {

    async updateProfile(req, res) {
        try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
            success: false,
            message: 'Validation errors',
            errors: errors.array()
            });
        }

        const { firstName, lastName, phone, dateOfBirth, gender } = req.body;
        
        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            {
            'profile.firstName': firstName,
            'profile.lastName': lastName,
            'profile.phone': phone,
            'profile.dateOfBirth': dateOfBirth,
            'profile.gender': gender
            },
            { new: true, runValidators: true }
        ).select('-supertokensId');

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: updatedUser
        });
        } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating profile',
            error: error.message
        });
        }
    }

    async addAddress(req, res) {
        try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
            success: false,
            message: 'Validation errors',
            errors: errors.array()
            });
        }

        const addressData = req.body;
        
        if (addressData.isDefault) {
            await User.findByIdAndUpdate(
            req.user._id,
            { $set: { "addresses.$[].isDefault": false } }
            );
        }
        
        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            { $push: { addresses: addressData } },
            { new: true, runValidators: true }
        ).select('-supertokensId');

        res.json({
            success: true,
            message: 'Address added successfully',
            data: updatedUser
        });
        } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error adding address',
            error: error.message
        });
        }
    }

    async updateAddress(req, res) {
        try {
        const { addressId } = req.params;
        const addressData = req.body;
        
        if (addressData.isDefault) {
            await User.findByIdAndUpdate(
            req.user._id,
            { $set: { "addresses.$[].isDefault": false } }
            );
        }
        
        const updatedUser = await User.findOneAndUpdate(
            { _id: req.user._id, "addresses._id": addressId },
            { $set: { "addresses.$": addressData } },
            { new: true, runValidators: true }
        ).select('-supertokensId');

        if (!updatedUser) {
            return res.status(404).json({
            success: false,
            message: 'Address not found'
            });
        }

        res.json({
            success: true,
            message: 'Address updated successfully',
            data: updatedUser
        });
        } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating address',
            error: error.message
        });
        }
    }

    async deleteAddress(req, res) {
        try {
        const { addressId } = req.params;
        
        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            { $pull: { addresses: { _id: addressId } } },
            { new: true }
        ).select('-supertokensId');

        res.json({
            success: true,
            message: 'Address deleted successfully',
            data: updatedUser
        });
        } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting address',
            error: error.message
        });
        }
    }

    async updatePreferences(req, res) {
        try {
        const { notifications, language, currency } = req.body;
        
        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            {
            $set: {
                'preferences.notifications': notifications,
                'preferences.language': language,
                'preferences.currency': currency
            }
            },
            { new: true, runValidators: true }
        ).select('-supertokensId');

        res.json({
            success: true,
            message: 'Preferences updated successfully',
            data: updatedUser
        });
        } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating preferences',
            error: error.message
        });
        }
    }

    // async updateAvatar(req, res) {
    //     try {
    //     if (!req.file) {
    //         return res.status(400).json({
    //         success: false,
    //         message: 'No image file provided'
    //         });
    //     }

    //     // رفع الصورة إلى Cloudinary (سيتم تنفيذها لاحقاً)
    //     const avatarUrl = `/uploads/users/${req.file.filename}`;
        
    //     const updatedUser = await User.findByIdAndUpdate(
    //         req.user._id,
    //         { 'profile.avatar': avatarUrl },
    //         { new: true }
    //     ).select('-supertokensId');

    //     res.json({
    //         success: true,
    //         message: 'Avatar updated successfully',
    //         data: updatedUser
    //     });
    //     } catch (error) {
    //     res.status(500).json({
    //         success: false,
    //         message: 'Error updating avatar',
    //         error: error.message
    //     });
    //     }
    // }
    }

    module.exports = new ProfileController();
