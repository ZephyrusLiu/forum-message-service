require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/database');
const { connectRabbitMQ, closeRabbitMQ } = require('./src/config/rabbitmq');

const PORT = process.env.PORT || 5002;

const startServer = async () => {
  try {
    console.log(`[${new Date().toISOString()}] [INFO] Starting Message Service...`);
    console.log(`[${new Date().toISOString()}] [INFO] Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`[${new Date().toISOString()}] [INFO] Port: ${PORT}`);
    
    await connectDB();
    
    try {
      await connectRabbitMQ();
    } catch (mqError) {
      console.warn(`[${new Date().toISOString()}] [WARN] RabbitMQ connection failed, service will continue without MQ: ${mqError.message}`);
    }
    
    app.listen(PORT, () => {
      console.log(`[${new Date().toISOString()}] [INFO] Message Service is running on port ${PORT}`);
      console.log(`[${new Date().toISOString()}] [INFO] Health check available at: http://localhost:${PORT}/message-service/health`);
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] [ERROR] Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

const gracefulShutdown = async (signal) => {
  console.log(`[${new Date().toISOString()}] [INFO] ${signal} received, shutting down gracefully...`);
  try {
    await closeRabbitMQ();
    console.log(`[${new Date().toISOString()}] [INFO] Graceful shutdown completed`);
    process.exit(0);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] [ERROR] Error during shutdown: ${error.message}`);
    process.exit(1);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

startServer();
