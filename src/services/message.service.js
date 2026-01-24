const Message = require('../models/message.model');
const mongoose = require('mongoose');
const { ValidationError, DatabaseConnectionError, NotFoundError } = require('../utils/customErrors');
const { publishContactCreatedEvent } = require('../utils/messagePublisher');

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
    
    const messageResult = {
      messageId: savedMessage._id.toString(),
      email: savedMessage.email,
      subject: savedMessage.subject,
      message: savedMessage.message,
      userId: savedMessage.userId,
      status: savedMessage.status,
      dateCreated: savedMessage.dateCreated
    };

    try {
      await publishContactCreatedEvent({
        messageId: messageResult.messageId,
        subject: messageResult.subject,
        email: messageResult.email,
        message: messageResult.message,
        dateCreated: messageResult.dateCreated
      });
    } catch (mqError) {
      console.error(`[${new Date().toISOString()}] [ERROR] Failed to publish event to RabbitMQ, but message saved: ${mqError.message}`);
    }
    
    return messageResult;
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

const getAllMessages = async () => {
  try {
    console.log(`[${new Date().toISOString()}] [INFO] Retrieving all messages from database`);

    const messages = await Message.find()
      .select('dateCreated subject email message status userId _id')
      .sort({ dateCreated: -1 })
      .lean();

    const formattedMessages = messages.map(msg => ({
      messageId: msg._id.toString(),
      email: msg.email,
      subject: msg.subject,
      message: msg.message,
      userId: msg.userId,
      status: msg.status,
      dateCreated: msg.dateCreated
    }));

    console.log(`[${new Date().toISOString()}] [INFO] Retrieved ${formattedMessages.length} messages successfully`);
    
    return formattedMessages;
  } catch (error) {
    if (error.name === 'MongoServerError' || error.name === 'MongooseError') {
      console.error(`[${new Date().toISOString()}] [ERROR] Database error while retrieving messages - Error: ${error.message}`);
      throw new DatabaseConnectionError('Failed to retrieve messages from database');
    }
    
    console.error(`[${new Date().toISOString()}] [ERROR] Unexpected error in getAllMessages - Error: ${error.message}`);
    throw error;
  }
};

const updateMessageStatus = async (messageId, newStatus) => {
  try {
    if (!messageId || typeof messageId !== 'string') {
      throw new ValidationError('MessageId is required');
    }

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      throw new ValidationError('Invalid messageId format');
    }

    console.log(`[${new Date().toISOString()}] [INFO] Updating message status - MessageId: ${messageId}, NewStatus: ${newStatus}`);

    const message = await Message.findById(messageId);

    if (!message) {
      console.log(`[${new Date().toISOString()}] [WARN] Message not found - MessageId: ${messageId}`);
      throw new NotFoundError('Message not found');
    }

    const oldStatus = message.status;
    message.status = newStatus;
    const updatedMessage = await message.save();

    console.log(`[${new Date().toISOString()}] [INFO] Message status updated successfully - MessageId: ${messageId}, OldStatus: ${oldStatus}, NewStatus: ${newStatus}`);

    return {
      messageId: updatedMessage._id.toString(),
      email: updatedMessage.email,
      subject: updatedMessage.subject,
      message: updatedMessage.message,
      userId: updatedMessage.userId,
      status: updatedMessage.status,
      dateCreated: updatedMessage.dateCreated
    };
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ValidationError) {
      throw error;
    }

    if (error.name === 'CastError') {
      console.error(`[${new Date().toISOString()}] [ERROR] Invalid messageId format - MessageId: ${messageId}`);
      throw new ValidationError('Invalid messageId format');
    }

    if (error.name === 'MongoServerError' || error.name === 'MongooseError') {
      console.error(`[${new Date().toISOString()}] [ERROR] Database error while updating message - MessageId: ${messageId}, Error: ${error.message}`);
      throw new DatabaseConnectionError('Failed to update message in database');
    }

    console.error(`[${new Date().toISOString()}] [ERROR] Unexpected error in updateMessageStatus - MessageId: ${messageId}, Error: ${error.message}`);
    throw error;
  }
};

module.exports = {
  createContactMessage,
  getAllMessages,
  updateMessageStatus
};
