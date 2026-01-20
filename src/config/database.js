const mongoose = require('mongoose');
const { DatabaseConnectionError } = require('../utils/customErrors');

const connectDB = async () => {
  try {
    console.log(`[${new Date().toISOString()}] [INFO] Attempting to connect to MongoDB...`);
    console.log(`[${new Date().toISOString()}] [INFO] Target database: message_db`);
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: 'message_db'
    });

    console.log(`[${new Date().toISOString()}] [INFO] MongoDB Connected successfully: ${conn.connection.host}`);
    console.log(`[${new Date().toISOString()}] [INFO] Database: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[${new Date().toISOString()}] [ERROR] Database connection failed:`, error.message);
    throw new DatabaseConnectionError(`Failed to connect to database: ${error.message}`);
  }
};

module.exports = connectDB;
