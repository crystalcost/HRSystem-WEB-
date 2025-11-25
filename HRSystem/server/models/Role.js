import { query } from '../config/Database.js';

export class Role {
  constructor(roleData) {
    this.id = roleData.role_id;
    this.name = roleData.role_name;
    this.displayName = roleData.display_name;
  }

  static async findById(id) {
    try {
      const sql = 'SELECT * FROM roles WHERE role_id = ?';
      const roles = await query(sql, [id]);
      return roles.length > 0 ? new Role(roles[0]) : null;
    } catch (error) {
      throw new Error(`Error finding role by ID: ${error.message}`);
    }
  }

  static async findByName(name) {
    try {
      const sql = 'SELECT * FROM roles WHERE role_name = ?';
      const roles = await query(sql, [name]);
      return roles.length > 0 ? new Role(roles[0]) : null;
    } catch (error) {
      throw new Error(`Error finding role by name: ${error.message}`);
    }
  }

  static async findAll() {
    try {
      const sql = 'SELECT * FROM roles ORDER BY role_id';
      const roles = await query(sql);
      return roles.map(role => new Role(role));
    } catch (error) {
      throw new Error(`Error finding all roles: ${error.message}`);
    }
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      displayName: this.displayName
    };
  }
}