const { loginRequired } = require('../../../utils/javascript/auth');

/**
 * JWT Authentication Middleware
 * Uses loginRequired utility from utils/javascript/auth.js (parent Group Project folder)
 */
const authenticateJWT = loginRequired;

module.exports = authenticateJWT;
