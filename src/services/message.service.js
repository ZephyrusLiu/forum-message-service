const Message = require('../models/message.model');
const { ValidationError, DatabaseConnectionError } = require('../utils/customErrors');

const createContactMessage = async (messageData) => {
  try {
    const { email, subject, message, userId } = messageData;

    console.log(`[${new Date().toISOString()}] [INFO] Creating contact message - Email: ${email}, Subject: ${subject.substring(0, 50)}${subject.length > 50 ? '...' : ''}, UserId: ${userId || 'null'}`);

    const messageDoc = new Message({
      email,
      subject,
      message,
      userId: userId || null,
      status: 'Open',
      dateCreated: new Date()
    });

    const savedMessage = await messageDoc.save();
    
    console.log(`[${new Date().toISOString()}] [INFO] Contact message created successfully - MessageId: ${savedMessage._id.toString()}, Email: ${email}`);
    
    return {
      messageId: savedMessage._id.toString(),
      email: savedMessage.email,
      subject: savedMessage.subject,
      message: savedMessage.message,
      userId: savedMessage.userId,
      status: savedMessage.status,
      dateCreated: savedMessage.dateCreated
    };
  } catch (error) {
    if (error.name === 'ValidationError') {
      const validationMessage = Object.values(error.errors)
        .map(err => err.message)
        .join(', ');
      console.error(`[${new Date().toISOString()}] [ERROR] Message validation failed - Email: ${messageData.email || 'N/A'}, Error: ${validationMessage}`);
      throw new ValidationError(validationMessage);
    }
    
    if (error.name === 'MongoServerError' || error.name === 'MongooseError') {
      console.error(`[${new Date().toISOString()}] [ERROR] Database error while saving message - Email: ${messageData.email || 'N/A'}, Error: ${error.message}`);
      throw new DatabaseConnectionError('Failed to save message to database');
    }
    
    console.error(`[${new Date().toISOString()}] [ERROR] Unexpected error in createContactMessage - Email: ${messageData.email || 'N/A'}, Error: ${error.message}`);
    throw error;
  }
};

module.exports = {
  createContactMessage
};
