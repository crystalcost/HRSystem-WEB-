import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'crysta1C0st';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ 
        status: 'FAILED', 
        message: 'Требуется аутентификация' 
      });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(403).json({ 
        status: 'FAILED', 
        message: 'Пользователь не найден' 
      });
    }
    req.user = user;
    next();
  } catch (error) {
    console.error('Ошибка верификации JWT токена:', error);
    return res.status(403).json({ 
      status: 'FAILED', 
      message: 'Недействительный токен' 
    });
  }
};

export const generateToken = (userId, username, role) => {
  return jwt.sign(
    { 
      userId, 
      username, 
      role 
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};