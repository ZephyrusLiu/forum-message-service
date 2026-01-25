const { permissionChecking } = require('../../../utils/javascript/auth');

/**
 * Admin Authorization Middleware
 * Uses permissionChecking utility from utils/javascript/auth.js (parent Group Project folder)
 * Allows only 'admin' and 'super' roles
 */
const requireAdmin = permissionChecking('admin', 'super');

module.exports = requireAdmin;
