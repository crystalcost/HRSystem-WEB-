import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { query } from '../config/Database.js';

export class UserService {
  async getAllUsers() {
    try {
      const users = await User.findAll();
      return users.map(user => user.toJSON());
    } catch (error) {
      throw new Error(`Error getting all users: ${error.message}`);
    }
  }

  async getUserById(id) {
    try {
      const user = await User.findById(id);
      return user ? user.toJSON() : null;
    } catch (error) {
      throw new Error(`Error getting user by ID: ${error.message}`);
    }
  }

  async getUserByUsername(username) {
    try {
      const user = await User.findByUsername(username);
      return user ? user.toJSON() : null;
    } catch (error) {
      throw new Error(`Error getting user by username: ${error.message}`);
    }
  }

  async createUser(userDTO) {
    try {
      const { username, password, email, firstName, lastName, roleId } = userDTO;

      if (!password || password.trim().length === 0) {
        throw new Error('Пароль не может быть пустым');
      }

      const roleSql = 'SELECT * FROM roles WHERE role_id = ?';
      const roles = await query(roleSql, [roleId]);
      if (roles.length === 0) {
        throw new Error('Роль не найдена');
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
      return user.toJSON();

    } catch (error) {
      throw new Error(`Error creating user: ${error.message}`);
    }
  }

  async updateUser(id, userDTO) {
    try {
      const user = await User.findById(id);
      if (!user) {
        throw new Error('Пользователь не найден');
      }

      user.username = userDTO.username;
      user.email = userDTO.email;
      user.firstName = userDTO.firstName;
      user.lastName = userDTO.lastName;
      user.roleId = userDTO.roleId;

      if (userDTO.password && userDTO.password.trim().length > 0) {
        await user.updatePassword(userDTO.password);
      }

      await user.save();
      return user.toJSON();

    } catch (error) {
      throw new Error(`Error updating user: ${error.message}`);
    }
  }

  async adminUpdatePassword(userId, newPassword) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return { status: 'FAILED', message: 'Пользователь не найден' };
      }

      await user.updatePassword(newPassword);
      return { status: 'SUCCESS', message: 'Пароль пользователя успешно изменен' };

    } catch (error) {
      return { status: 'FAILED', message: error.message };
    }
  }

  async updatePassword(userId, oldPassword, newPassword) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return { status: 'FAILED', message: 'Пользователь не найден' };
      }

      const isValidPassword = await user.validatePassword(oldPassword);
      if (!isValidPassword) {
        return { status: 'FAILED', message: 'Неверный старый пароль' };
      }

      await user.updatePassword(newPassword);
      return { status: 'SUCCESS', message: 'Пароль успешно изменен' };

    } catch (error) {
      return { status: 'FAILED', message: error.message };
    }
  }

  async deleteUser(id) {
    try {
      const user = await User.findById(id);
      if (!user) {
        return { status: 'FAILED', message: 'Пользователь не найден' };
      }

      await user.delete();
      return { status: 'SUCCESS', message: 'Пользователь удален' };

    } catch (error) {
      return { status: 'FAILED', message: error.message };
    }
  }

  async getAllManagers() {
    try {
      const managers = await User.findAllManagers();
      return managers.map(manager => manager.toJSON());
    } catch (error) {
      throw new Error(`Error getting managers: ${error.message}`);
    }
  }
}