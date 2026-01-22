const { UnauthorizedError, ForbiddenError } = require('../utils/customErrors');

const checkAdminPermission = (req, res, next) => {
  const userType = req.headers['x-user-type'];
  const userId = req.headers['x-user-id'];
  const ipAddress = req.ip || req.connection.remoteAddress;

  if (!userType) {
    console.log(`[${new Date().toISOString()}] [WARN] Unauthorized access attempt - Missing X-User-Type header, IP: ${ipAddress}`);
    throw new UnauthorizedError('Authentication required');
  }

  const normalizedUserType = userType.trim();
  const allowedTypes = ['Admin', 'Super Admin'];
  const isAuthorized = allowedTypes.some(type => 
    normalizedUserType.toLowerCase() === type.toLowerCase()
  );

  if (!isAuthorized) {
    console.log(`[${new Date().toISOString()}] [WARN] Forbidden access attempt - UserType: ${normalizedUserType}, UserId: ${userId || 'N/A'}, IP: ${ipAddress}`);
    throw new ForbiddenError('Admin access required');
  }

  req.user = {
    userId: userId ? parseInt(userId, 10) : null,
    userType: normalizedUserType
  };

  console.log(`[${new Date().toISOString()}] [INFO] Admin access granted - UserType: ${normalizedUserType}, UserId: ${userId || 'N/A'}, IP: ${ipAddress}`);
  next();
};

module.exports = checkAdminPermission;
