// middlewares/role.js
// ==========================================
// WHY: Different users (patient, hospital, insurer) should only access
// their own routes. This middleware runs AFTER auth.js and checks role.
// Usage: roleMiddleware('patient') — blocks hospitals/insurers from patient routes
// ==========================================

function roleMiddleware(requiredRole) {
  return (req, res, next) => {
    if (req.user.role !== requiredRole) {
      return res.status(403).json({
        error: `Access denied. This route requires role: ${requiredRole}. Your role: ${req.user.role}`
      });
    }
    next();
  };
}

module.exports = roleMiddleware;
