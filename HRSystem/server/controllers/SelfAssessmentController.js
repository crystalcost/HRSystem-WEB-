import { SelfAssessmentService } from '../services/SelfAssessmentService.js';

const selfAssessmentService = new SelfAssessmentService();

export const getAllSelfAssessments = async (req, res) => {
  try {
    const assessments = await selfAssessmentService.getAllSelfAssessments();
    res.json(assessments);
  } catch (error) {
    res.status(500).json({
      status: 'FAILED',
      message: error.message
    });
  }
};

export const getSelfAssessmentById = async (req, res) => {
  try {
    const assessment = await selfAssessmentService.getSelfAssessmentById(req.params.id);
    if (assessment) {
      res.json(assessment);
    } else {
      res.status(404).json({
        status: 'FAILED',
        message: 'Самооценка не найдена'
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 'FAILED',
      message: error.message
    });
  }
};

export const getSelfAssessmentsByUserId = async (req, res) => {
  try {
    const assessments = await selfAssessmentService.getSelfAssessmentsByUserId(req.params.userId);
    res.json(assessments);
  } catch (error) {
    res.status(500).json({
      status: 'FAILED',
      message: error.message
    });
  }
};

export const createSelfAssessment = async (req, res) => {
  try {
    const assessment = await selfAssessmentService.createSelfAssessment(req.body);
    res.json({
      status: 'SUCCESS',
      message: 'Самооценка добавлена',
      assessmentId: assessment.assessmentId
    });
  } catch (error) {
    res.status(400).json({
      status: 'FAILED',
      message: error.message
    });
  }
};

export const updateSelfAssessment = async (req, res) => {
  try {
    const assessment = await selfAssessmentService.updateSelfAssessment(req.params.id, req.body);
    res.json({
      status: 'SUCCESS',
      message: 'Самооценка обновлена',
      assessment: assessment
    });
  } catch (error) {
    res.status(400).json({
      status: 'FAILED',
      message: error.message
    });
  }
};

export const deleteSelfAssessment = async (req, res) => {
  try {
    const response = await selfAssessmentService.deleteSelfAssessment(req.params.id);
    res.json(response);
  } catch (error) {
    res.status(500).json({
      status: 'FAILED',
      message: error.message
    });
  }
};