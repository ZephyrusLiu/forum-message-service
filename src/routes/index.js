const express = require('express');
const router = express.Router();
const { getHealth } = require('../controllers/health.controller');
const { createContactMessage, getAllMessages, updateMessageStatus } = require('../controllers/message.controller');
const validateContactMessage = require('../middlewares/validateContactMessage');
const checkAdminPermission = require('../middlewares/checkAdminPermission');
const validateStatusUpdate = require('../middlewares/validateStatusUpdate');

router.get('/health', getHealth);
router.post('/contactus', validateContactMessage, createContactMessage);
router.get('/messages', checkAdminPermission, getAllMessages);
router.put('/messages/:messageId', checkAdminPermission, validateStatusUpdate, updateMessageStatus);

module.exports = router;
