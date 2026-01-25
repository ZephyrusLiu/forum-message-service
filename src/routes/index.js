const express = require('express');
const router = express.Router();
const { getHealth } = require('../controllers/health.controller');
const { createContactMessage, getAllMessages, updateMessageStatus } = require('../controllers/message.controller');
const validateContactMessage = require('../middlewares/validateContactMessage');
const validateStatusUpdate = require('../middlewares/validateStatusUpdate');

// JWT authentication middlewares
const authenticateJWT = require('../middlewares/authenticateJWT');
const requireAdmin = require('../middlewares/requireAdmin');

// Public endpoints (no authentication)
router.get('/message-service/health', getHealth);
router.post('/contactus', validateContactMessage, createContactMessage);

// Admin-only endpoints (JWT authentication + admin authorization)
router.get('/messages', authenticateJWT, requireAdmin, getAllMessages);
router.put('/messages/:messageId', authenticateJWT, requireAdmin, validateStatusUpdate, updateMessageStatus);

module.exports = router;
