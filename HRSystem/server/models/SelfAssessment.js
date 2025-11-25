import { query } from '../config/Database.js';

export class SelfAssessment {
  constructor(assessmentData) {
    this.assessmentId = assessmentData.assessment_id;
    this.userId = assessmentData.user_id;
    this.skillName = assessmentData.skill_name;
    this.skillLevel = assessmentData.skill_level;
    this.submittedAt = assessmentData.submitted_at;
  }

  static async findById(id) {
    try {
      const sql = 'SELECT * FROM selfassessments WHERE assessment_id = ?';
      const assessments = await query(sql, [id]);
      return assessments.length > 0 ? new SelfAssessment(assessments[0]) : null;
    } catch (error) {
      throw new Error(`Error finding self assessment by ID: ${error.message}`);
    }
  }

  static async findByUserId(userId) {
    try {
      const sql = 'SELECT * FROM selfassessments WHERE user_id = ? ORDER BY submitted_at DESC';
      const assessments = await query(sql, [userId]);
      return assessments.map(assessment => new SelfAssessment(assessment));
    } catch (error) {
      throw new Error(`Error finding self assessments by user ID: ${error.message}`);
    }
  }

  static async findAll() {
    try {
      const sql = 'SELECT * FROM selfassessments ORDER BY submitted_at DESC';
      const assessments = await query(sql);
      return assessments.map(assessment => new SelfAssessment(assessment));
    } catch (error) {
      throw new Error(`Error finding all self assessments: ${error.message}`);
    }
  }

  async save() {
    try {
      if (this.assessmentId) {
        const sql = `
          UPDATE selfassessments 
          SET user_id = ?, skill_name = ?, skill_level = ?
          WHERE assessment_id = ?
        `;
        await query(sql, [
          this.userId,
          this.skillName,
          this.skillLevel,
          this.assessmentId
        ]);
      } else {
        const sql = `
          INSERT INTO selfassessments (user_id, skill_name, skill_level, submitted_at)
          VALUES (?, ?, ?, NOW())
        `;
        const result = await query(sql, [
          this.userId,
          this.skillName,
          this.skillLevel
        ]);
        this.assessmentId = result.insertId;
      }
      return this;
    } catch (error) {
      throw new Error(`Error saving self assessment: ${error.message}`);
    }
  }

  async delete() {
    try {
      const sql = 'DELETE FROM selfassessments WHERE assessment_id = ?';
      await query(sql, [this.assessmentId]);
    } catch (error) {
      throw new Error(`Error deleting self assessment: ${error.message}`);
    }
  }

  toJSON() {
    return {
      assessmentId: this.assessmentId,
      userId: this.userId,
      skillName: this.skillName,
      skillLevel: this.skillLevel,
      submittedAt: this.submittedAt
    };
  }
}