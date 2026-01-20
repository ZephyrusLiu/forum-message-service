const messageService = require('../services/message.service');

const createContactMessage = async (req, res, next) => {
  try {
    const { email, subject, message } = req.body;
    const userId = req.user ? req.user.userId : null;
    const ipAddress = req.ip || req.connection.remoteAddress;

    console.log(`[${new Date().toISOString()}] [INFO] POST /contactus request received - IP: ${ipAddress}, Email: ${email}, UserId: ${userId || 'visitor'}`);

    const messageData = {
      email,
      subject,
      message,
      userId
    };

    const createdMessage = await messageService.createContactMessage(messageData);

    console.log(`[${new Date().toISOString()}] [INFO] POST /contactus response sent - Status: 201, MessageId: ${createdMessage.messageId}`);
    res.status(201).json(createdMessage);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] [ERROR] POST /contactus failed - Email: ${req.body.email || 'N/A'}, Error: ${error.message}`);
    next(error);
  }
};

module.exports = {
  createContactMessage
};
