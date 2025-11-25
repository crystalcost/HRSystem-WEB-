import { query } from '../config/Database.js';

export class TrainingService {
  async getAllTrainingRequests() {
    try {
      const sql = `
        SELECT t.*, u.username, u.email, u.first_name, u.last_name
        FROM trainingrequests t
        LEFT JOIN users u ON t.user_id = u.user_id
        ORDER BY t.submitted_at DESC
      `;
      const requests = await query(sql);
      return requests.map(this.mapRequest);
    } catch (error) {
      throw new Error(`Error getting training requests: ${error.message}`);
    }
  }

  async getTrainingRequestById(id) {
    try {
      const sql = `
        SELECT t.*, u.username, u.email, u.first_name, u.last_name
        FROM trainingrequests t
        LEFT JOIN users u ON t.user_id = u.user_id
        WHERE t.request_id = ?
      `;
      const requests = await query(sql, [id]);
      return requests.length > 0 ? this.mapRequest(requests[0]) : null;
    } catch (error) {
      throw new Error(`Error getting training request by ID: ${error.message}`);
    }
  }

  async getTrainingRequestsByUserId(userId) {
    try {
      const sql = `
        SELECT t.*, u.username, u.email, u.first_name, u.last_name
        FROM trainingrequests t
        LEFT JOIN users u ON t.user_id = u.user_id
        WHERE t.user_id = ?
        ORDER BY t.submitted_at DESC
      `;
      const requests = await query(sql, [userId]);
      return requests.map(this.mapRequest);
    } catch (error) {
      throw new Error(`Error getting training requests by user ID: ${error.message}`);
    }
  }

  async getTrainingRequestsByStatus(status) {
    try {
      const sql = `
        SELECT t.*, u.username, u.email, u.first_name, u.last_name
        FROM trainingrequests t
        LEFT JOIN users u ON t.user_id = u.user_id
        WHERE t.status = ?
        ORDER BY t.submitted_at DESC
      `;
      const requests = await query(sql, [status]);
      return requests.map(this.mapRequest);
    } catch (error) {
      throw new Error(`Error getting training requests by status: ${error.message}`);
    }
  }

  async createTrainingRequest(requestData) {
    try {
      const { user, courseName } = requestData;

      const existingRequests = await this.getTrainingRequestsByUserId(user.id);
      if (existingRequests.length >= 5) {
        return { status: 'FAILED', message: 'Максимум можно подать 5 заявок' };
      }

      for (const existing of existingRequests) {
        if (existing.courseName === courseName) {
          return { status: 'FAILED', message: 'Уже подана заявка на этот курс' };
        }
      }

      const sql = `
        INSERT INTO trainingrequests (user_id, course_name, status, submitted_at)
        VALUES (?, ?, 'PENDING', NOW())
      `;
      
      const result = await query(sql, [
        user.id,
        courseName
      ]);

      return { 
        status: 'SUCCESS', 
        message: 'Заявка на курс подана',
        requestId: result.insertId
      };

    } catch (error) {
      throw new Error(`Error creating training request: ${error.message}`);
    }
  }

  async updateTrainingRequest(id, requestData) {
    try {
      const { user, courseName, status } = requestData;

      const sql = `
        UPDATE trainingrequests 
        SET user_id = ?, course_name = ?, status = ?
        WHERE request_id = ?
      `;
      
      await query(sql, [
        user.id,
        courseName,
        status,
        id
      ]);

      return await this.getTrainingRequestById(id);

    } catch (error) {
      throw new Error(`Error updating training request: ${error.message}`);
    }
  }

  async updateTrainingRequestStatus(id, status) {
    try {
      const request = await this.getTrainingRequestById(id);
      if (!request) {
        return { status: 'FAILED', message: 'Заявка не найдена' };
      }

      const sql = 'UPDATE trainingrequests SET status = ? WHERE request_id = ?';
      await query(sql, [status, id]);

      return { status: 'SUCCESS', message: 'Статус заявки обновлен' };

    } catch (error) {
      return { status: 'FAILED', message: error.message };
    }
  }

  async deleteTrainingRequest(id) {
    try {
      const request = await this.getTrainingRequestById(id);
      if (!request) {
        return { status: 'FAILED', message: 'Заявка не найдена' };
      }

      const sql = 'DELETE FROM trainingrequests WHERE request_id = ?';
      await query(sql, [id]);

      return { status: 'SUCCESS', message: 'Заявка удалена' };

    } catch (error) {
      return { status: 'FAILED', message: error.message };
    }
  }

  mapRequest(row) {
    return {
      requestId: row.request_id,
      user: {
        id: row.user_id,
        username: row.username,
        email: row.email,
        firstName: row.first_name,
        lastName: row.last_name
      },
      courseName: row.course_name,
      status: row.status,
      submittedAt: row.submitted_at
    };
  }
}