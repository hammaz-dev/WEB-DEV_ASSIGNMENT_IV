const jwt = require('jsonwebtoken');

// Reads the token from "Authorization: Bearer <t>" or from a "token" cookie
// (Postman in the lab screenshot sends it as a cookie). No cookie-parser needed.
function extractToken(headers) {
  const auth = headers.authorization || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7).trim();

  const cookieHeader = headers.cookie || '';
  for (const part of cookieHeader.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === 'token') return decodeURIComponent(rest.join('='));
  }
  return null;
}

function verifyToken(req, res, next) {
  const token = extractToken(req.headers);
  if (!token) return res.status(403).json({ message: 'No token provided' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET); // { id, username, role }
    next();
  } catch (err) {
    const message = err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
    res.status(401).json({ message });
  }
}

// RBAC: authorizeRoles('admin') etc.
function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient role' });
    }
    next();
  };
}

module.exports = { verifyToken, authorizeRoles, extractToken };
