    const multer = require('multer');
    const path = require('path');
    const fs = require('fs');

    const uploadDir = 'uploads/users';
    if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    }

    const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${req.user._id}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
    });

    const fileFilter = (req, file, cb) => {

    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed'), false);
    }
    };

    const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
    });

    const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            success: false,
            message: 'File too large. Maximum size is 5MB'
        });
        }
    }
    
    if (err.message === 'Only image files are allowed') {
        return res.status(400).json({
        success: false,
        message: 'Only image files are allowed'
        });
    }
    
    next(err);
    };

    module.exports = {
    uploadAvatar: upload.single('avatar'),
    handleUploadError
    };
