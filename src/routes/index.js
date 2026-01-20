const express = require('express');
const router = express.Router();
const { getHealth } = require('../controllers/health.controller');
const { createContactMessage } = require('../controllers/message.controller');
const validateContactMessage = require('../middlewares/validateContactMessage');

router.get('/health', getHealth);
router.post('/contactus', validateContactMessage, createContactMessage);

module.exports = router;
