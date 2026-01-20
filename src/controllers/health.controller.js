const mongoose = require('mongoose');

const getHealth = (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  
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
