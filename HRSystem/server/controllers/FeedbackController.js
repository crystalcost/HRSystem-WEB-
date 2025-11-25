import { FeedbackService } from '../services/FeedbackService.js';

const feedbackService = new FeedbackService();

export const getAllFeedback = async (req, res) => {
  try {
    const feedback = await feedbackService.getAllFeedback();
    res.json(feedback);
  } catch (error) {
    res.status(500).json({
      status: 'FAILED',
      message: error.message
    });
  }
};

export const getFeedbackById = async (req, res) => {
  try {
    const feedback = await feedbackService.getFeedbackById(req.params.id);
    if (feedback) {
      res.json(feedback);
    } else {
      res.status(404).json({
        status: 'FAILED',
        message: 'Отзыв не найден'
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 'FAILED',
      message: error.message
    });
  }
};

export const getFeedbacksByEvaluationId = async (req, res) => {
  try {
    const feedback = await feedbackService.getFeedbacksByEvaluationId(req.params.evaluationId);
    res.json(feedback);
  } catch (error) {
    res.status(500).json({
      status: 'FAILED',
      message: error.message
    });
  }
};

export const getFeedbacksByUserId = async (req, res) => {
  try {
    const feedback = await feedbackService.getFeedbacksByUserId(req.params.userId);
    res.json(feedback);
  } catch (error) {
    res.status(500).json({
      status: 'FAILED',
      message: error.message
    });
  }
};

export const createFeedback = async (req, res) => {
  try {
    const feedback = await feedbackService.createFeedback(req.body);
    res.json({
      status: 'SUCCESS',
      message: 'Отзыв добавлен',
      feedbackId: feedback.feedbackId
    });
  } catch (error) {
    res.status(400).json({
      status: 'FAILED',
      message: error.message
    });
  }
};

export const updateFeedback = async (req, res) => {
  try {
    const feedback = await feedbackService.updateFeedback(req.params.id, req.body);
    res.json({
      status: 'SUCCESS',
      message: 'Отзыв обновлен',
      feedback: feedback
    });
  } catch (error) {
    res.status(400).json({
      status: 'FAILED',
      message: error.message
    });
  }
};

export const deleteFeedback = async (req, res) => {
  try {
    const response = await feedbackService.deleteFeedback(req.params.id);
    res.json(response);
  } catch (error) {
    res.status(500).json({
      status: 'FAILED',
      message: error.message
    });
  }
};