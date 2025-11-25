import { query } from '../config/Database.js';

export class Feedback {
  constructor(feedbackData) {
    this.feedbackId = feedbackData.feedback_id;
    this.evaluationId = feedbackData.evaluation_id;
    this.feedbackText = feedbackData.feedback_text;
    this.createdAt = feedbackData.created_at;
  }

  static async findById(id) {
    try {
      const sql = 'SELECT * FROM feedback WHERE feedback_id = ?';
      const feedbacks = await query(sql, [id]);
      return feedbacks.length > 0 ? new Feedback(feedbacks[0]) : null;
    } catch (error) {
      throw new Error(`Error finding feedback by ID: ${error.message}`);
    }
  }

  static async findByEvaluationId(evaluationId) {
    try {
      const sql = 'SELECT * FROM feedback WHERE evaluation_id = ? ORDER BY created_at DESC';
      const feedbacks = await query(sql, [evaluationId]);
      return feedbacks.map(fb => new Feedback(fb));
    } catch (error) {
      throw new Error(`Error finding feedback by evaluation ID: ${error.message}`);
    }
  }

  static async findAll() {
    try {
      const sql = 'SELECT * FROM feedback ORDER BY created_at DESC';
      const feedbacks = await query(sql);
      return feedbacks.map(fb => new Feedback(fb));
    } catch (error) {
      throw new Error(`Error finding all feedback: ${error.message}`);
    }
  }

  async save() {
    try {
      if (this.feedbackId) {
        const sql = `
          UPDATE feedback 
          SET evaluation_id = ?, feedback_text = ?
          WHERE feedback_id = ?
        `;
        await query(sql, [
          this.evaluationId,
          this.feedbackText,
          this.feedbackId
        ]);
      } else {
        const sql = `
          INSERT INTO feedback (evaluation_id, feedback_text, created_at)
          VALUES (?, ?, NOW())
        `;
        const result = await query(sql, [
          this.evaluationId,
          this.feedbackText
        ]);
        this.feedbackId = result.insertId;
      }
      return this;
    } catch (error) {
      throw new Error(`Error saving feedback: ${error.message}`);
    }
  }

  async delete() {
    try {
      const sql = 'DELETE FROM feedback WHERE feedback_id = ?';
      await query(sql, [this.feedbackId]);
    } catch (error) {
      throw new Error(`Error deleting feedback: ${error.message}`);
    }
  }

  toJSON() {
    return {
      feedbackId: this.feedbackId,
      evaluationId: this.evaluationId,
      feedbackText: this.feedbackText,
      createdAt: this.createdAt
    };
  }
}