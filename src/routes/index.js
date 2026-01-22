const express = require('express');
const router = express.Router();
const { getHealth } = require('../controllers/health.controller');
const { createContactMessage, getAllMessages } = require('../controllers/message.controller');
const validateContactMessage = require('../middlewares/validateContactMessage');
const checkAdminPermission = require('../middlewares/checkAdminPermission');

router.get('/health', getHealth);
router.post('/contactus', validateContactMessage, createContactMessage);
router.get('/messages', checkAdminPermission, getAllMessages);

module.exports = router;
