import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'change-this-secret';
const JWT_EXPIRES = process.env.ADMIN_JWT_EXPIRES || '24h';

// Middleware to require admin authentication
export function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header required' });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Validate admin credentials and return JWT
export async function authenticateAdmin(username, password) {
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

  if (!adminUsername || !adminPasswordHash) {
    throw new Error('Admin credentials not configured');
  }

  if (username !== adminUsername) {
    return null;
  }

  const validPassword = await bcrypt.compare(password, adminPasswordHash);
  if (!validPassword) {
    return null;
  }

  const token = jwt.sign(
    { username, role: 'admin' },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );

  return token;
}

// Generate password hash (utility function)
export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}
