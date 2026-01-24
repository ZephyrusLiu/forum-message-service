const { ValidationError } = require('../utils/customErrors');

const validateStatusUpdate = (req, res, next) => {
  const { status } = req.body;

  if (!status || typeof status !== 'string') {
    console.log(`[${new Date().toISOString()}] [WARN] Validation failed - Missing or invalid status field`);
    throw new ValidationError('Status is required and must be a string');
  }

  const trimmedStatus = status.trim();
  if (trimmedStatus !== 'Open' && trimmedStatus !== 'Closed') {
    console.log(`[${new Date().toISOString()}] [WARN] Validation failed - Invalid status value: ${trimmedStatus}`);
    throw new ValidationError("Status must be either 'Open' or 'Closed'");
  }

  req.body.status = trimmedStatus;
  console.log(`[${new Date().toISOString()}] [INFO] Status validation passed - Status: ${trimmedStatus}`);
  next();
};

module.exports = validateStatusUpdate;
