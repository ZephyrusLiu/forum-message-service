const amqp = require('amqplib');
let connection = null;
let channel = null;

const EXCHANGE_NAME = 'contact_exchange';
const EXCHANGE_TYPE = 'topic';

const connectRabbitMQ = async () => {
  try {
    if (connection && channel) {
      console.log(`[${new Date().toISOString()}] [INFO] RabbitMQ already connected`);
      return { connection, channel };
    }

    const rabbitmqUri = process.env.RABBITMQ_URI;
    if (!rabbitmqUri) {
      throw new Error('RABBITMQ_URI environment variable is not set');
    }

    console.log(`[${new Date().toISOString()}] [INFO] Connecting to RabbitMQ...`);
    
    connection = await amqp.connect(rabbitmqUri);
    
    connection.on('error', (err) => {
      console.error(`[${new Date().toISOString()}] [ERROR] RabbitMQ connection error:`, err.message);
      connection = null;
      channel = null;
    });

    connection.on('close', () => {
      console.log(`[${new Date().toISOString()}] [WARN] RabbitMQ connection closed`);
      connection = null;
      channel = null;
    });

    channel = await connection.createChannel();
    
    await channel.assertExchange(EXCHANGE_NAME, EXCHANGE_TYPE, {
      durable: true
    });

    console.log(`[${new Date().toISOString()}] [INFO] RabbitMQ Connected successfully`);
    console.log(`[${new Date().toISOString()}] [INFO] RabbitMQ Channel created successfully`);
    console.log(`[${new Date().toISOString()}] [INFO] Exchange '${EXCHANGE_NAME}' asserted`);

    return { connection, channel };
  } catch (error) {
    console.error(`[${new Date().toISOString()}] [ERROR] Failed to connect to RabbitMQ:`, error.message);
    connection = null;
    channel = null;
    throw error;
  }
};

const getChannel = () => {
  if (!channel) {
    throw new Error('RabbitMQ channel is not initialized. Call connectRabbitMQ() first.');
  }
  return channel;
};

const isConnected = () => {
  return connection !== null && channel !== null;
};

const closeRabbitMQ = async () => {
  try {
    if (channel) {
      await channel.close();
      channel = null;
      console.log(`[${new Date().toISOString()}] [INFO] RabbitMQ channel closed`);
    }
    if (connection) {
      await connection.close();
      connection = null;
      console.log(`[${new Date().toISOString()}] [INFO] RabbitMQ connection closed`);
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] [ERROR] Error closing RabbitMQ connection:`, error.message);
  }
};

module.exports = {
  connectRabbitMQ,
  getChannel,
  isConnected,
  closeRabbitMQ
};
