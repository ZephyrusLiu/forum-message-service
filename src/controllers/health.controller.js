const mongoose = require('mongoose');

const getHealth = (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const ipAddress = req.ip || req.connection.remoteAddress;
  
  console.log(`[${new Date().toISOString()}] [INFO] GET /health request - IP: ${ipAddress}, Database: ${dbStatus}`);
  
  res.status(200).json({
    status: 'UP',
    service: 'message-service',
    timestamp: new Date().toISOString(),
    database: dbStatus
  });
};

module.exports = {
  getHealth
};
