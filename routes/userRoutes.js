const express = require('express');
const router = express.Router();
const { signup, login, logout, getProfile, updatePassword, refreshToken, verifyOtp, resendOtp } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const { signupValidationRules, loginValidationRules, validateResult } = require('../middlewares/validationMiddleware');

// Auth Routes
router.post('/signup', signupValidationRules, validateResult, signup);
router.post('/login', loginValidationRules, validateResult, login);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/logout', logout);
router.post('/refresh', refreshToken);

// Profile Routes
router.get('/profile', protect, getProfile);
router.put('/profile/password', protect, updatePassword);

module.exports = router;