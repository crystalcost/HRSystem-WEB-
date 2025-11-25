import { query } from '../config/Database.js';

export class TrainingRequest {
  constructor(requestData) {
    this.requestId = requestData.request_id;
    this.userId = requestData.user_id;
    this.courseName = requestData.course_name;
    this.status = requestData.status;
    this.submittedAt = requestData.submitted_at;
  }

  static async findById(id) {
    try {
      const sql = 'SELECT * FROM trainingrequests WHERE request_id = ?';
      const requests = await query(sql, [id]);
      return requests.length > 0 ? new TrainingRequest(requests[0]) : null;
    } catch (error) {
      throw new Error(`Error finding training request by ID: ${error.message}`);
    }
  }

  static async findByUserId(userId) {
    try {
      const sql = 'SELECT * FROM trainingrequests WHERE user_id = ? ORDER BY submitted_at DESC';
      const requests = await query(sql, [userId]);
      return requests.map(req => new TrainingRequest(req));
    } catch (error) {
      throw new Error(`Error finding training requests by user ID: ${error.message}`);
    }
  }

  static async findByStatus(status) {
    try {
      const sql = 'SELECT * FROM trainingrequests WHERE status = ? ORDER BY submitted_at DESC';
      const requests = await query(sql, [status]);
      return requests.map(req => new TrainingRequest(req));
    } catch (error) {
      throw new Error(`Error finding training requests by status: ${error.message}`);
    }
  }

  static async findAll() {
    try {
      const sql = 'SELECT * FROM trainingrequests ORDER BY submitted_at DESC';
      const requests = await query(sql);
      return requests.map(req => new TrainingRequest(req));
    } catch (error) {
      throw new Error(`Error finding all training requests: ${error.message}`);
    }
  }

  async save() {
    try {
      if (this.requestId) {
        const sql = `
          UPDATE trainingrequests 
          SET user_id = ?, course_name = ?, status = ?
          WHERE request_id = ?
        `;
        await query(sql, [
          this.userId,
          this.courseName,
          this.status,
          this.requestId
        ]);
      } else {
        const sql = `
          INSERT INTO trainingrequests (user_id, course_name, status, submitted_at)
          VALUES (?, ?, ?, NOW())
        `;
        const result = await query(sql, [
          this.userId,
          this.courseName,
          this.status || 'PENDING'
        ]);
        this.requestId = result.insertId;
      }
      return this;
    } catch (error) {
      throw new Error(`Error saving training request: ${error.message}`);
    }
  }

  async delete() {
    try {
      const sql = 'DELETE FROM trainingrequests WHERE request_id = ?';
      await query(sql, [this.requestId]);
    } catch (error) {
      throw new Error(`Error deleting training request: ${error.message}`);
    }
  }

  toJSON() {
    return {
      requestId: this.requestId,
      userId: this.userId,
      courseName: this.courseName,
      status: this.status,
      submittedAt: this.submittedAt
    };
  }
}