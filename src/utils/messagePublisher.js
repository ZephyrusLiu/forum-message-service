const { getChannel, isConnected } = require('../config/rabbitmq');

const EXCHANGE_NAME = 'contact_exchange';
const ROUTING_KEY = 'contact.created';

const publishContactCreatedEvent = async (messageData) => {
  try {
    if (!isConnected()) {
      throw new Error('RabbitMQ is not connected');
    }

    const channel = getChannel();
    
    const payload = JSON.stringify({
      messageId: messageData.messageId,
      subject: messageData.subject,
      email: messageData.email,
      message: messageData.message,
      dateCreated: messageData.dateCreated
    });

    const published = channel.publish(
      EXCHANGE_NAME,
      ROUTING_KEY,
      Buffer.from(payload),
      {
        persistent: true,
        contentType: 'application/json'
      }
    );

    if (published) {
      console.log(`[${new Date().toISOString()}] [MQ] Published message to ${EXCHANGE_NAME} with key ${ROUTING_KEY} - MessageId: ${messageData.messageId}`);
      return true;
    } else {
      console.warn(`[${new Date().toISOString()}] [WARN] Message buffer is full, message may not be published immediately`);
      return false;
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] [ERROR] Failed to publish to RabbitMQ:`, error.message);
    throw error;
  }
};

module.exports = {
  publishContactCreatedEvent
};
