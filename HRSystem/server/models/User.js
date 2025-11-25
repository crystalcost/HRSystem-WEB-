import bcrypt from 'bcryptjs';
import { query } from '../config/Database.js';

export class User {
  constructor(userData) {
    this.id = userData.user_id || userData.id;
    this.username = userData.username;
    this.password = userData.password;
    this.email = userData.email;
    this.firstName = userData.first_name || userData.firstName;
    this.lastName = userData.last_name || userData.lastName;
    
    // Правильное формирование объекта роли
    this.role = {
      role_id: userData.role_id,
      role_name: userData.role_name || userData.role,
      display_name: userData.display_name
    };
    
    this.roleId = userData.role_id || userData.roleId;
  }

  static async findByUsername(username) {
    try {
      const sql = `
        SELECT u.*, r.role_id, r.role_name, r.display_name 
        FROM users u 
        LEFT JOIN roles r ON u.role_id = r.role_id 
        WHERE u.username = ?
      `;
      const users = await query(sql, [username]);
      return users.length > 0 ? new User(users[0]) : null;
    } catch (error) {
      throw new Error(`Error finding user by username: ${error.message}`);
    }
  }

  static async findById(id) {
    try {
      const sql = `
        SELECT u.*, r.role_id, r.role_name, r.display_name 
        FROM users u 
        LEFT JOIN roles r ON u.role_id = r.role_id 
        WHERE u.user_id = ?
      `;
      const users = await query(sql, [id]);
      return users.length > 0 ? new User(users[0]) : null;
    } catch (error) {
      throw new Error(`Error finding user by ID: ${error.message}`);
    }
  }

  static async findByEmail(email) {
    try {
      const sql = 'SELECT * FROM users WHERE email = ?';
      const users = await query(sql, [email]);
      return users.length > 0 ? new User(users[0]) : null;
    } catch (error) {
      throw new Error(`Error finding user by email: ${error.message}`);
    }
  }

  static async findAll() {
    try {
      const sql = `
        SELECT u.*, r.role_name, r.display_name 
        FROM users u 
        LEFT JOIN roles r ON u.role_id = r.role_id 
        ORDER BY u.user_id
      `;
      const users = await query(sql);
      return users.map(user => new User(user));
    } catch (error) {
      throw new Error(`Error finding all users: ${error.message}`);
    }
  }

  static async findAllManagers() {
    try {
      const sql = `
        SELECT u.*, r.role_name, r.display_name 
        FROM users u 
        LEFT JOIN roles r ON u.role_id = r.role_id 
        WHERE r.role_name = 'MANAGER'
        ORDER BY u.user_id
      `;
      const users = await query(sql);
      return users.map(user => new User(user));
    } catch (error) {
      throw new Error(`Error finding managers: ${error.message}`);
    }
  }

  async save() {
    try {
      if (this.id) {
        const sql = `
          UPDATE users 
          SET username = ?, email = ?, first_name = ?, last_name = ?, role_id = ?
          WHERE user_id = ?
        `;
        await query(sql, [
          this.username,
          this.email,
          this.firstName,
          this.lastName,
          this.roleId,
          this.id
        ]);
      } else {
        const sql = `
          INSERT INTO users (username, password, email, first_name, last_name, role_id) 
          VALUES (?, ?, ?, ?, ?, ?)
        `;
        const result = await query(sql, [
          this.username,
          this.password,
          this.email,
          this.firstName,
          this.lastName,
          this.roleId
        ]);
        this.id = result.insertId;
      }
      return this;
    } catch (error) {
      throw new Error(`Error saving user: ${error.message}`);
    }
  }

  async updatePassword(newPassword) {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const sql = 'UPDATE users SET password = ? WHERE user_id = ?';
      await query(sql, [hashedPassword, this.id]);
      this.password = hashedPassword;
    } catch (error) {
      throw new Error(`Error updating password: ${error.message}`);
    }
  }

  async delete() {
    try {
      const sql = 'DELETE FROM users WHERE user_id = ?';
      await query(sql, [this.id]);
    } catch (error) {
      throw new Error(`Error deleting user: ${error.message}`);
    }
  }

  async validatePassword(password) {
    return await bcrypt.compare(password, this.password);
  }

  static async existsByUsername(username) {
    const user = await this.findByUsername(username);
    return user !== null;
  }

  static async existsByEmail(email) {
    const user = await this.findByEmail(email);
    return user !== null;
  }

  toJSON() {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      role: this.role ? {
        id: this.role.role_id,
        name: this.role.role_name,
        displayName: this.role.display_name
      } : null
    };
  }
}