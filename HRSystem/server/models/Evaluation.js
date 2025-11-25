import { query } from '../config/Database.js';

export class Evaluation {
    constructor(evaluationData) {
        this.evaluationId = evaluationData.evaluation_id;
        this.userId = evaluationData.user_id;
        this.managerId = evaluationData.manager_id;
        this.kpiCompletedTasks = parseFloat(evaluationData.kpi_completed_tasks) || 0;
        this.kpiFixTime = parseFloat(evaluationData.kpi_fix_time) || 0;
        this.kpiTestCoverage = parseFloat(evaluationData.kpi_test_coverage) || 0;
        this.kpiTimeliness = parseFloat(evaluationData.kpi_timeliness) || 0;
        this.overallKpi = parseFloat(evaluationData.overall_kpi) || 0;
        this.comments = evaluationData.comments;
        this.evaluationDate = evaluationData.evaluation_date;
      }

  static async findById(id) {
    try {
      const sql = 'SELECT * FROM evaluations WHERE evaluation_id = ?';
      const evaluations = await query(sql, [id]);
      return evaluations.length > 0 ? new Evaluation(evaluations[0]) : null;
    } catch (error) {
      throw new Error(`Error finding evaluation by ID: ${error.message}`);
    }
  }

  static async findByUserId(userId) {
    try {
      const sql = 'SELECT * FROM evaluations WHERE user_id = ? ORDER BY evaluation_date DESC';
      const evaluations = await query(sql, [userId]);
      return evaluations.map(evaluation => new Evaluation(eval));
    } catch (error) {
      throw new Error(`Error finding evaluations by user ID: ${error.message}`);
    }
  }

  static async findByManagerId(managerId) {
    try {
      const sql = 'SELECT * FROM evaluations WHERE manager_id = ? ORDER BY evaluation_date DESC';
      const evaluations = await query(sql, [managerId]);
      return evaluations.map(evaluation => new Evaluation(eval));
    } catch (error) {
      throw new Error(`Error finding evaluations by manager ID: ${error.message}`);
    }
  }

  static async findAll() {
    try {
      const sql = 'SELECT * FROM evaluations ORDER BY evaluation_date DESC';
      const evaluations = await query(sql);
      return evaluations.map(evaluation => new Evaluation(eval));
    } catch (error) {
      throw new Error(`Error finding all evaluations: ${error.message}`);
    }
  }

  async save() {
    try {
      if (this.evaluationId) {
        const sql = `
          UPDATE evaluations 
          SET user_id = ?, manager_id = ?, kpi_completed_tasks = ?, kpi_fix_time = ?, 
              kpi_test_coverage = ?, kpi_timeliness = ?, overall_kpi = ?, comments = ?
          WHERE evaluation_id = ?
        `;
        await query(sql, [
          this.userId,
          this.managerId,
          this.kpiCompletedTasks,
          this.kpiFixTime,
          this.kpiTestCoverage,
          this.kpiTimeliness,
          this.overallKpi,
          this.comments,
          this.evaluationId
        ]);
      } else {
        const sql = `
          INSERT INTO evaluations 
          (user_id, manager_id, kpi_completed_tasks, kpi_fix_time, kpi_test_coverage, 
           kpi_timeliness, overall_kpi, comments, evaluation_date)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;
        const result = await query(sql, [
          this.userId,
          this.managerId,
          this.kpiCompletedTasks,
          this.kpiFixTime,
          this.kpiTestCoverage,
          this.kpiTimeliness,
          this.overallKpi,
          this.comments
        ]);
        this.evaluationId = result.insertId;
      }
      return this;
    } catch (error) {
      throw new Error(`Error saving evaluation: ${error.message}`);
    }
  }

  async delete() {
    try {
      const sql = 'DELETE FROM evaluations WHERE evaluation_id = ?';
      await query(sql, [this.evaluationId]);
    } catch (error) {
      throw new Error(`Error deleting evaluation: ${error.message}`);
    }
  }

  toJSON() {
    return {
      evaluationId: this.evaluationId,
      userId: this.userId,
      managerId: this.managerId,
      kpiCompletedTasks: this.kpiCompletedTasks,
      kpiFixTime: this.kpiFixTime,
      kpiTestCoverage: this.kpiTestCoverage,
      kpiTimeliness: this.kpiTimeliness,
      overallKpi: this.overallKpi,
      comments: this.comments,
      evaluationDate: this.evaluationDate
    };
  }
}