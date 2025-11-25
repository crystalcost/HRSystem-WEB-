import { EvaluationService } from '../services/EvaluationService.js';

const evaluationService = new EvaluationService();

export const getAllEvaluations = async (req, res) => {
  try {
    const evaluations = await evaluationService.getAllEvaluations();
    res.json(evaluations);
  } catch (error) {
    res.status(500).json({
      status: 'FAILED',
      message: error.message
    });
  }
};

export const getEvaluationById = async (req, res) => {
  try {
    const evaluation = await evaluationService.getEvaluationById(req.params.id);
    if (evaluation) {
      res.json(evaluation);
    } else {
      res.status(404).json({
        status: 'FAILED',
        message: 'Оценка не найдена'
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 'FAILED',
      message: error.message
    });
  }
};

export const getUserEvaluations = async (req, res) => {
  try {
    const evaluations = await evaluationService.getUserEvaluations(req.params.userId);
    res.json(evaluations);
  } catch (error) {
    res.status(500).json({
      status: 'FAILED',
      message: error.message
    });
  }
};

export const getManagerEvaluations = async (req, res) => {
  try {
    const evaluations = await evaluationService.getManagerEvaluations(req.params.managerId);
    res.json(evaluations);
  } catch (error) {
    res.status(500).json({
      status: 'FAILED',
      message: error.message
    });
  }
};

export const getManagerEmployeeEvaluations = async (req, res) => {
  try {
    const evaluations = await evaluationService.getManagerEmployeeEvaluations(
      req.params.managerId,
      req.params.employeeId
    );
    res.json(evaluations);
  } catch (error) {
    res.status(500).json({
      status: 'FAILED',
      message: error.message
    });
  }
};

export const createEvaluation = async (req, res) => {
  try {
    const evaluation = await evaluationService.createEvaluation(req.body);
    res.json({
      status: 'SUCCESS',
      message: 'Оценка добавлена',
      evaluationId: evaluation.evaluationId
    });
  } catch (error) {
    res.status(400).json({
      status: 'FAILED',
      message: error.message
    });
  }
};

export const updateEvaluation = async (req, res) => {
  try {
    const evaluation = await evaluationService.updateEvaluation(req.params.id, req.body);
    res.json({
      status: 'SUCCESS',
      message: 'Оценка обновлена',
      evaluation: evaluation
    });
  } catch (error) {
    res.status(400).json({
      status: 'FAILED',
      message: error.message
    });
  }
};

export const deleteEvaluation = async (req, res) => {
  try {
    const response = await evaluationService.deleteEvaluation(req.params.id);
    res.json(response);
  } catch (error) {
    res.status(500).json({
      status: 'FAILED',
      message: error.message
    });
  }
};