import { User } from '../models/User.js';

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

    next();
  } catch (error) {
    return res.status(403).json({ 
      status: 'FAILED', 
      message: 'Недействительный токен' 
    });
  }
};

export const requireRole = (role) => {
  return async (req, res, next) => {
    try {
      next();
    } catch (error) {
      res.status(403).json({ 
        status: 'FAILED', 
        message: 'Недостаточно прав' 
      });
    }
  };
};