import { query } from '../config/Database.js';

export class FeedbackService {
  async getAllFeedback() {
    try {
      const sql = `
        SELECT f.*, e.evaluation_id, e.overall_kpi,
               u.user_id, u.username as user_username, u.first_name as user_first_name, u.last_name as user_last_name,
               m.user_id as manager_id, m.username as manager_username, m.first_name as manager_first_name, m.last_name as manager_last_name
        FROM feedback f
        LEFT JOIN evaluations e ON f.evaluation_id = e.evaluation_id
        LEFT JOIN users u ON e.user_id = u.user_id
        LEFT JOIN users m ON e.manager_id = m.user_id
        ORDER BY f.created_at DESC
      `;
      const feedback = await query(sql);
      return feedback.map(this.mapFeedback);
    } catch (error) {
      throw new Error(`Error getting feedback: ${error.message}`);
    }
  }

  async getFeedbackById(id) {
    try {
      const sql = `
        SELECT f.*, e.evaluation_id, e.overall_kpi,
               u.user_id, u.username as user_username, u.first_name as user_first_name, u.last_name as user_last_name,
               m.user_id as manager_id, m.username as manager_username, m.first_name as manager_first_name, m.last_name as manager_last_name
        FROM feedback f
        LEFT JOIN evaluations e ON f.evaluation_id = e.evaluation_id
        LEFT JOIN users u ON e.user_id = u.user_id
        LEFT JOIN users m ON e.manager_id = m.user_id
        WHERE f.feedback_id = ?
      `;
      const feedback = await query(sql, [id]);
      return feedback.length > 0 ? this.mapFeedback(feedback[0]) : null;
    } catch (error) {
      throw new Error(`Error getting feedback by ID: ${error.message}`);
    }
  }

  async getFeedbacksByEvaluationId(evaluationId) {
    try {
      const sql = `
        SELECT f.*, e.evaluation_id, e.overall_kpi,
               u.user_id, u.username as user_username, u.first_name as user_first_name, u.last_name as user_last_name,
               m.user_id as manager_id, m.username as manager_username, m.first_name as manager_first_name, m.last_name as manager_last_name
        FROM feedback f
        LEFT JOIN evaluations e ON f.evaluation_id = e.evaluation_id
        LEFT JOIN users u ON e.user_id = u.user_id
        LEFT JOIN users m ON e.manager_id = m.user_id
        WHERE f.evaluation_id = ?
        ORDER BY f.created_at DESC
      `;
      const feedback = await query(sql, [evaluationId]);
      return feedback.map(this.mapFeedback);
    } catch (error) {
      throw new Error(`Error getting feedback by evaluation ID: ${error.message}`);
    }
  }

  async getFeedbacksByUserId(userId) {
    try {
      const sql = `
        SELECT f.*, e.evaluation_id, e.overall_kpi,
               u.user_id, u.username as user_username, u.first_name as user_first_name, u.last_name as user_last_name,
               m.user_id as manager_id, m.username as manager_username, m.first_name as manager_first_name, m.last_name as manager_last_name
        FROM feedback f
        LEFT JOIN evaluations e ON f.evaluation_id = e.evaluation_id
        LEFT JOIN users u ON e.user_id = u.user_id
        LEFT JOIN users m ON e.manager_id = m.user_id
        WHERE e.user_id = ?
        ORDER BY f.created_at DESC
      `;
      const feedback = await query(sql, [userId]);
      return feedback.map(this.mapFeedback);
    } catch (error) {
      throw new Error(`Error getting feedback by user ID: ${error.message}`);
    }
  }

  async createFeedback(feedbackData) {
    try {
      const { evaluation, feedbackText } = feedbackData;

      const sql = `
        INSERT INTO feedback (evaluation_id, feedback_text, created_at)
        VALUES (?, ?, NOW())
      `;
      
      const result = await query(sql, [
        evaluation.evaluationId,
        feedbackText
      ]);

      return await this.getFeedbackById(result.insertId);

    } catch (error) {
      throw new Error(`Error creating feedback: ${error.message}`);
    }
  }

  async updateFeedback(id, feedbackData) {
    try {
      const { evaluation, feedbackText } = feedbackData;

      const sql = `
        UPDATE feedback 
        SET evaluation_id = ?, feedback_text = ?
        WHERE feedback_id = ?
      `;
      
      await query(sql, [
        evaluation.evaluationId,
        feedbackText,
        id
      ]);

      return await this.getFeedbackById(id);

    } catch (error) {
      throw new Error(`Error updating feedback: ${error.message}`);
    }
  }

  async deleteFeedback(id) {
    try {
      const feedback = await this.getFeedbackById(id);
      if (!feedback) {
        return { status: 'FAILED', message: 'Отзыв не найден' };
      }

      const sql = 'DELETE FROM feedback WHERE feedback_id = ?';
      await query(sql, [id]);

      return { status: 'SUCCESS', message: 'Отзыв удален' };

    } catch (error) {
      return { status: 'FAILED', message: error.message };
    }
  }

  mapFeedback(row) {
    return {
      feedbackId: row.feedback_id,
      evaluation: {
        evaluationId: row.evaluation_id,
        overallKpi: parseFloat(row.overall_kpi) || 0,
        user: {
          id: row.user_id,
          username: row.user_username,
          firstName: row.user_first_name,
          lastName: row.user_last_name
        },
        manager: {
          id: row.manager_id,
          username: row.manager_username,
          firstName: row.manager_first_name,
          lastName: row.manager_last_name
        }
      },
      feedbackText: row.feedback_text,
      createdAt: row.created_at
    };
  }
}