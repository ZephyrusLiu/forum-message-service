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

const getAllMessages = async (req, res, next) => {
  try {
    const adminUserId = req.user ? req.user.userId : null;
    const adminUserType = req.user ? req.user.userType : 'Unknown';
    const ipAddress = req.ip || req.connection.remoteAddress;

    console.log(`[${new Date().toISOString()}] [INFO] GET /messages request received - Admin UserId: ${adminUserId || 'N/A'}, UserType: ${adminUserType}, IP: ${ipAddress}`);

    const messages = await messageService.getAllMessages();

    console.log(`[${new Date().toISOString()}] [INFO] GET /messages response sent - Status: 200, Count: ${messages.length}, Admin UserId: ${adminUserId || 'N/A'}`);
    res.status(200).json(messages);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] [ERROR] GET /messages failed - Admin UserId: ${req.user ? req.user.userId : 'N/A'}, Error: ${error.message}`);
    next(error);
  }
};

module.exports = {
  createContactMessage,
  getAllMessages
};
