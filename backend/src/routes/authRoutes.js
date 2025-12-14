const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes
router.post('/register', authController.register);
router.post('/verify-otp', authController.verifyOTP);
router.post('/login', authController.login);
router.post('/resend-otp', authController.resendOTP);

// Protected routes
router.get('/profile', authMiddleware, authController.getProfile);
router.put('/theme', authMiddleware, authController.updateTheme);

module.exports = router;