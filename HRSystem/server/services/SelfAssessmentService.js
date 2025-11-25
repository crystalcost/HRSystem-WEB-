import { query } from '../config/Database.js';

export class SelfAssessmentService {
  async getAllSelfAssessments() {
    try {
      const sql = `
        SELECT s.*, u.username, u.first_name, u.last_name
        FROM selfassessments s
        LEFT JOIN users u ON s.user_id = u.user_id
        ORDER BY s.submitted_at DESC
      `;
      const assessments = await query(sql);
      return assessments.map(this.mapAssessment);
    } catch (error) {
      throw new Error(`Error getting self assessments: ${error.message}`);
    }
  }

  async getSelfAssessmentById(id) {
    try {
      const sql = `
        SELECT s.*, u.username, u.first_name, u.last_name
        FROM selfassessments s
        LEFT JOIN users u ON s.user_id = u.user_id
        WHERE s.assessment_id = ?
      `;
      const assessments = await query(sql, [id]);
      return assessments.length > 0 ? this.mapAssessment(assessments[0]) : null;
    } catch (error) {
      throw new Error(`Error getting self assessment by ID: ${error.message}`);
    }
  }

  async getSelfAssessmentsByUserId(userId) {
    try {
      const sql = `
        SELECT s.*, u.username, u.first_name, u.last_name
        FROM selfassessments s
        LEFT JOIN users u ON s.user_id = u.user_id
        WHERE s.user_id = ?
        ORDER BY s.submitted_at DESC
      `;
      const assessments = await query(sql, [userId]);
      return assessments.map(this.mapAssessment);
    } catch (error) {
      throw new Error(`Error getting self assessments by user ID: ${error.message}`);
    }
  }

  async createSelfAssessment(assessmentData) {
    try {
      const { user, skillName, skillLevel } = assessmentData;

      const sql = `
        INSERT INTO selfassessments (user_id, skill_name, skill_level, submitted_at)
        VALUES (?, ?, ?, NOW())
      `;
      
      const result = await query(sql, [
        user.id,
        skillName,
        skillLevel
      ]);

      return await this.getSelfAssessmentById(result.insertId);

    } catch (error) {
      throw new Error(`Error creating self assessment: ${error.message}`);
    }
  }

  async updateSelfAssessment(id, assessmentData) {
    try {
      const { user, skillName, skillLevel } = assessmentData;

      const sql = `
        UPDATE selfassessments 
        SET user_id = ?, skill_name = ?, skill_level = ?
        WHERE assessment_id = ?
      `;
      
      await query(sql, [
        user.id,
        skillName,
        skillLevel,
        id
      ]);

      return await this.getSelfAssessmentById(id);

    } catch (error) {
      throw new Error(`Error updating self assessment: ${error.message}`);
    }
  }

  async deleteSelfAssessment(id) {
    try {
      const assessment = await this.getSelfAssessmentById(id);
      if (!assessment) {
        return { status: 'FAILED', message: 'Самооценка не найдена' };
      }

      const sql = 'DELETE FROM selfassessments WHERE assessment_id = ?';
      await query(sql, [id]);

      return { status: 'SUCCESS', message: 'Самооценка удалена' };

    } catch (error) {
      return { status: 'FAILED', message: error.message };
    }
  }

  mapAssessment(row) {
    return {
      assessmentId: row.assessment_id,
      user: {
        id: row.user_id,
        username: row.username,
        firstName: row.first_name,
        lastName: row.last_name
      },
      skillName: row.skill_name,
      skillLevel: row.skill_level,
      submittedAt: row.submitted_at
    };
  }
}