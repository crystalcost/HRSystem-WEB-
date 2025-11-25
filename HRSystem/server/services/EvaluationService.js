import { query } from '../config/Database.js';

export class EvaluationService {
  async getAllEvaluations() {
    try {
      const sql = `
        SELECT e.*, 
               u1.user_id as user_id, u1.username as user_username, u1.email as user_email, 
               u1.first_name as user_first_name, u1.last_name as user_last_name,
               u2.user_id as manager_id, u2.username as manager_username, u2.email as manager_email,
               u2.first_name as manager_first_name, u2.last_name as manager_last_name
        FROM evaluations e
        LEFT JOIN users u1 ON e.user_id = u1.user_id
        LEFT JOIN users u2 ON e.manager_id = u2.user_id
        ORDER BY e.evaluation_date DESC
      `;
      const evaluations = await query(sql);
      return evaluations.map(this.mapEvaluation);
    } catch (error) {
      throw new Error(`Error getting evaluations: ${error.message}`);
    }
  }

  async getEvaluationById(id) {
    try {
      const sql = `
        SELECT e.*, 
               u1.user_id as user_id, u1.username as user_username, u1.email as user_email, 
               u1.first_name as user_first_name, u1.last_name as user_last_name,
               u2.user_id as manager_id, u2.username as manager_username, u2.email as manager_email,
               u2.first_name as manager_first_name, u2.last_name as manager_last_name
        FROM evaluations e
        LEFT JOIN users u1 ON e.user_id = u1.user_id
        LEFT JOIN users u2 ON e.manager_id = u2.user_id
        WHERE e.evaluation_id = ?
      `;
      const evaluations = await query(sql, [id]);
      return evaluations.length > 0 ? this.mapEvaluation(evaluations[0]) : null;
    } catch (error) {
      throw new Error(`Error getting evaluation by ID: ${error.message}`);
    }
  }

  async getUserEvaluations(userId) {
    try {
      const sql = `
        SELECT e.*, 
               u1.user_id as user_id, u1.username as user_username, u1.email as user_email, 
               u1.first_name as user_first_name, u1.last_name as user_last_name,
               u2.user_id as manager_id, u2.username as manager_username, u2.email as manager_email,
               u2.first_name as manager_first_name, u2.last_name as manager_last_name
        FROM evaluations e
        LEFT JOIN users u1 ON e.user_id = u1.user_id
        LEFT JOIN users u2 ON e.manager_id = u2.user_id
        WHERE e.user_id = ?
        ORDER BY e.evaluation_date DESC
      `;
      const evaluations = await query(sql, [userId]);
      return evaluations.map(this.mapEvaluation);
    } catch (error) {
      throw new Error(`Error getting user evaluations: ${error.message}`);
    }
  }

  async getManagerEvaluations(managerId) {
    try {
      const sql = `
        SELECT e.*, 
               u1.user_id as user_id, u1.username as user_username, u1.email as user_email, 
               u1.first_name as user_first_name, u1.last_name as user_last_name,
               u2.user_id as manager_id, u2.username as manager_username, u2.email as manager_email,
               u2.first_name as manager_first_name, u2.last_name as manager_last_name
        FROM evaluations e
        LEFT JOIN users u1 ON e.user_id = u1.user_id
        LEFT JOIN users u2 ON e.manager_id = u2.user_id
        WHERE e.manager_id = ?
        ORDER BY e.evaluation_date DESC
      `;
      const evaluations = await query(sql, [managerId]);
      return evaluations.map(this.mapEvaluation);
    } catch (error) {
      throw new Error(`Error getting manager evaluations: ${error.message}`);
    }
  }

  async getManagerEmployeeEvaluations(managerId, employeeId) {
    try {
      const sql = `
        SELECT e.*, 
               u1.user_id as user_id, u1.username as user_username, u1.email as user_email, 
               u1.first_name as user_first_name, u1.last_name as user_last_name,
               u2.user_id as manager_id, u2.username as manager_username, u2.email as manager_email,
               u2.first_name as manager_first_name, u2.last_name as manager_last_name
        FROM evaluations e
        LEFT JOIN users u1 ON e.user_id = u1.user_id
        LEFT JOIN users u2 ON e.manager_id = u2.user_id
        WHERE e.manager_id = ? AND e.user_id = ?
        ORDER BY e.evaluation_date DESC
      `;
      const evaluations = await query(sql, [managerId, employeeId]);
      return evaluations.map(this.mapEvaluation);
    } catch (error) {
      throw new Error(`Error getting manager-employee evaluations: ${error.message}`);
    }
  }

  async createEvaluation(evaluationData) {
    try {
      const {
        user, manager, kpiCompletedTasks, kpiFixTime, 
        kpiTestCoverage, kpiTimeliness, overallKpi, comments
      } = evaluationData;

      const sql = `
        INSERT INTO evaluations 
        (user_id, manager_id, kpi_completed_tasks, kpi_fix_time, kpi_test_coverage, kpi_timeliness, overall_kpi, comments, evaluation_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `;
      
      const result = await query(sql, [
        user.id,
        manager.id,
        kpiCompletedTasks,
        kpiFixTime,
        kpiTestCoverage,
        kpiTimeliness,
        overallKpi,
        comments
      ]);

      return await this.getEvaluationById(result.insertId);

    } catch (error) {
      throw new Error(`Error creating evaluation: ${error.message}`);
    }
  }

  async updateEvaluation(id, evaluationData) {
    try {
      const {
        user, manager, kpiCompletedTasks, kpiFixTime, 
        kpiTestCoverage, kpiTimeliness, overallKpi, comments
      } = evaluationData;

      const sql = `
        UPDATE evaluations 
        SET user_id = ?, manager_id = ?, kpi_completed_tasks = ?, kpi_fix_time = ?, 
            kpi_test_coverage = ?, kpi_timeliness = ?, overall_kpi = ?, comments = ?, evaluation_date = NOW()
        WHERE evaluation_id = ?
      `;
      
      await query(sql, [
        user.id,
        manager.id,
        kpiCompletedTasks,
        kpiFixTime,
        kpiTestCoverage,
        kpiTimeliness,
        overallKpi,
        comments,
        id
      ]);

      return await this.getEvaluationById(id);

    } catch (error) {
      throw new Error(`Error updating evaluation: ${error.message}`);
    }
  }

  async deleteEvaluation(id) {
    try {
      const evaluation = await this.getEvaluationById(id);
      if (!evaluation) {
        return { status: 'FAILED', message: 'Оценка не найдена' };
      }

      const sql = 'DELETE FROM evaluations WHERE evaluation_id = ?';
      await query(sql, [id]);

      return { status: 'SUCCESS', message: 'Оценка удалена' };

    } catch (error) {
      return { status: 'FAILED', message: error.message };
    }
  }

  mapEvaluation(row) {
    return {
      evaluationId: row.evaluation_id,
      user: {
        id: row.user_id,
        username: row.user_username,
        email: row.user_email,
        firstName: row.user_first_name,
        lastName: row.user_last_name
      },
      manager: {
        id: row.manager_id,
        username: row.manager_username,
        email: row.manager_email,
        firstName: row.manager_first_name,
        lastName: row.manager_last_name
      },
      kpiCompletedTasks: parseFloat(row.kpi_completed_tasks) || 0,
      kpiFixTime: parseFloat(row.kpi_fix_time) || 0,
      kpiTestCoverage: parseFloat(row.kpi_test_coverage) || 0,
      kpiTimeliness: parseFloat(row.kpi_timeliness) || 0,
      overallKpi: parseFloat(row.overall_kpi) || 0,
      comments: row.comments,
      evaluationDate: row.evaluation_date
    };
  }
}