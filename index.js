require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/database');

const PORT = process.env.PORT || 5002;

const startServer = async () => {
  try {
    console.log(`[${new Date().toISOString()}] [INFO] Starting Message Service...`);
    console.log(`[${new Date().toISOString()}] [INFO] Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`[${new Date().toISOString()}] [INFO] Port: ${PORT}`);
    
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`[${new Date().toISOString()}] [INFO] Message Service is running on port ${PORT}`);
      console.log(`[${new Date().toISOString()}] [INFO] Health check available at: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] [ERROR] Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
