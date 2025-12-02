import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { query } from '../config/Database.js';
import { generateToken } from '../middleware/Auth.js';

export class AuthService {
  async register(registerRequest) {
    try {
      const { username, password, email, firstName, lastName, roleId } = registerRequest;

      if (!password || password.trim().length === 0) {
        return { status: 'FAILED', message: 'Пароль не может быть пустым' };
      }

      if (await User.existsByUsername(username)) {
        return { status: 'FAILED', message: 'Пользователь с таким именем уже существует' };
      }

      if (await User.existsByEmail(email)) {
        return { status: 'FAILED', message: 'Пользователь с таким email уже существует' };
      }

      const roleSql = 'SELECT * FROM roles WHERE role_id = ?';
      const roles = await query(roleSql, [roleId]);
      if (roles.length === 0) {
        return { status: 'FAILED', message: 'Указанная роль не найдена' };
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({
        username,
        password: hashedPassword,
        email,
        firstName,
        lastName,
        roleId
      });

      await user.save();
      const token = generateToken(user.id, user.username, user.role?.role_name);

      return {
        status: 'SUCCESS',
        userId: user.id,
        token: token,
        message: 'Пользователь успешно зарегистрирован'
      };
    } catch (error) {
      console.error('Ошибка регистрации пользователя:', error);
      return { status: 'FAILED', message: error.message };
    }
  }

  async authenticate(username, password) {
    try {
      const user = await User.findByUsername(username);
      
      if (!user) {
        return { status: 'FAILED', message: 'Неверные имя пользователя или пароль' };
      }

      const isValidPassword = await user.validatePassword(password);
      if (!isValidPassword) {
        return { status: 'FAILED', message: 'Неверные имя пользователя или пароль' };
      }
      
      if (!user.role || !user.role.role_name) {
        return { status: 'FAILED', message: 'Ошибка данных пользователя' };
      }
      const token = generateToken(user.id, user.username, user.role.role_name);
      return {
        status: 'SUCCESS',
        userId: user.id,
        role: user.role.role_name,
        username: user.username,
        token: token
      };
    } catch (error) {
      console.error('Ошибка аутентификации:', error);
      return { status: 'FAILED', message: error.message };
    }
  }
}