import { AuthService } from '../services/AuthService.js';

const authService = new AuthService();

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        status: 'FAILED',
        message: 'Имя пользователя и пароль обязательны'
      });
    }

    const response = await authService.authenticate(username, password);
    res.json(response);
  } catch (error) {
    console.error('Ошибка входа:', error);
    res.status(500).json({
      status: 'FAILED',
      message: error.message
    });
  }
};

export const register = async (req, res) => {
  try {
    const response = await authService.register(req.body);
    res.json(response);
  } catch (error) {
    res.status(500).json({
      status: 'FAILED',
      message: error.message
    });
  }
};