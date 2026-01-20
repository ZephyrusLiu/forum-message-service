const mongoose = require('mongoose');
const { DatabaseConnectionError } = require('../utils/customErrors');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('Database connection error:', error.message);
    throw new DatabaseConnectionError(`Failed to connect to database: ${error.message}`);
  }
};

module.exports = connectDB;
