const express = require('express');
const router = express.Router();
const authController = require('../controller/authController');
const { verifyToken } = require('../middlewares/auth');

router.post('/login', authController.login);
router.post('/forgot', authController.forgotPassword);
router.post('/forgot/verify-otp', authController.verifyOtp);  // New: verify OTP only
router.post('/forgot/verify', authController.verifyOtpAndReset);  // Original: verify OTP + reset password
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', verifyToken, authController.getCurrentUser);

module.exports = router;