const express = require('express');
const router = express.Router();
const authController = require('../controller/authController');

router.post('/login', authController.login);
router.post('/forgot', authController.forgotPassword);
router.post('/forgot/verify', authController.verifyOtpAndReset);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

module.exports = router;