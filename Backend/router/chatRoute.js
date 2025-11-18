// routes/chat.js
const express = require('express');
const router = express.Router();
const { chatController } = require('../controller/chatController');

// POST /chat
router.post('/', chatController);

module.exports = router;
