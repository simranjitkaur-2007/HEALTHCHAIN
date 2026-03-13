// middlewares/auth.js
// ==========================================
// WHY: Every protected API route needs to verify the user is logged in.
// This middleware runs BEFORE the route handler and checks the JWT token.
// If the token is missing or invalid, it rejects the request with 401.
// ==========================================

const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  // JWT is sent in the Authorization header as "Bearer <token>"
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided. Please log in.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // jwt.verify checks: (1) signature is valid, (2) token hasn't expired
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // attach user info to the request object
    next(); // proceed to the actual route handler
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ error: 'Invalid token.' });
  }
}

module.exports = authMiddleware;
