import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';

export async function attachUserFromToken(token) {
  if (!token) {
    return null;
  }

  const payload = jwt.verify(token, env.jwtSecret);
  return User.findById(payload.sub).select('-passwordHash');
}

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : req.query.token || '';

    if (!token) {
      return res.status(401).json({ message: 'Chua dang nhap' });
    }

    const user = await attachUserFromToken(token);

    if (!user || user.status === 'deleted') {
      return res.status(401).json({ message: 'Tai khoan khong ton tai' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Phien dang nhap khong hop le' });
  }
}
