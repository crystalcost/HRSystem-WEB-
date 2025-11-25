import { UserService } from '../services/UserService.js';

const userService = new UserService();

export const getAllUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({
      status: 'FAILED',
      message: error.message
    });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({
        status: 'FAILED',
        message: 'Пользователь не найден'
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 'FAILED',
      message: error.message
    });
  }
};

export const getUserByUsername = async (req, res) => {
  try {
    const user = await userService.getUserByUsername(req.params.username);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({
        status: 'FAILED',
        message: 'Пользователь не найден'
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 'FAILED',
      message: error.message
    });
  }
};

export const createUser = async (req, res) => {
  try {
    const user = await userService.createUser(req.body);
    res.json(user);
  } catch (error) {
    res.status(400).json({
      status: 'FAILED',
      message: error.message
    });
  }
};

export const updateUser = async (req, res) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    res.json(user);
  } catch (error) {
    res.status(400).json({
      status: 'FAILED',
      message: error.message
    });
  }
};

export const adminUpdatePassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.trim().length === 0) {
      return res.status(400).json({
        status: 'FAILED',
        message: 'Новый пароль не может быть пустым'
      });
    }

    const response = await userService.adminUpdatePassword(req.params.id, newPassword);
    res.json(response);
  } catch (error) {
    res.status(500).json({
      status: 'FAILED',
      message: error.message
    });
  }
};

export const updatePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        status: 'FAILED',
        message: 'Старый и новый пароль обязательны'
      });
    }

    const response = await userService.updatePassword(req.params.id, oldPassword, newPassword);
    res.json(response);
  } catch (error) {
    res.status(500).json({
      status: 'FAILED',
      message: error.message
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const response = await userService.deleteUser(req.params.id);
    res.json(response);
  } catch (error) {
    res.status(500).json({
      status: 'FAILED',
      message: error.message
    });
  }
};

export const getAllManagers = async (req, res) => {
  try {
    const managers = await userService.getAllManagers();
    res.json(managers);
  } catch (error) {
    res.status(500).json({
      status: 'FAILED',
      message: error.message
    });
  }
};