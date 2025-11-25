import { TrainingService } from '../services/TrainingService.js';

const trainingService = new TrainingService();

export const getAllTrainingRequests = async (req, res) => {
  try {
    const requests = await trainingService.getAllTrainingRequests();
    res.json(requests);
  } catch (error) {
    res.status(500).json({
      status: 'FAILED',
      message: error.message
    });
  }
};

export const getTrainingRequestById = async (req, res) => {
  try {
    const request = await trainingService.getTrainingRequestById(req.params.id);
    if (request) {
      res.json(request);
    } else {
      res.status(404).json({
        status: 'FAILED',
        message: 'Заявка не найдена'
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 'FAILED',
      message: error.message
    });
  }
};

export const getTrainingRequestsByUserId = async (req, res) => {
  try {
    const requests = await trainingService.getTrainingRequestsByUserId(req.params.userId);
    res.json(requests);
  } catch (error) {
    res.status(500).json({
      status: 'FAILED',
      message: error.message
    });
  }
};

export const getTrainingRequestsByStatus = async (req, res) => {
  try {
    const requests = await trainingService.getTrainingRequestsByStatus(req.params.status);
    res.json(requests);
  } catch (error) {
    res.status(500).json({
      status: 'FAILED',
      message: error.message
    });
  }
};

export const createTrainingRequest = async (req, res) => {
  try {
    const response = await trainingService.createTrainingRequest(req.body);
    res.json(response);
  } catch (error) {
    res.status(400).json({
      status: 'FAILED',
      message: error.message
    });
  }
};

export const updateTrainingRequest = async (req, res) => {
  try {
    const request = await trainingService.updateTrainingRequest(req.params.id, req.body);
    res.json({
      status: 'SUCCESS',
      message: 'Заявка обновлена',
      trainingRequest: request
    });
  } catch (error) {
    res.status(400).json({
      status: 'FAILED',
      message: error.message
    });
  }
};

export const updateTrainingRequestStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const response = await trainingService.updateTrainingRequestStatus(req.params.id, status);
    res.json(response);
  } catch (error) {
    res.status(400).json({
      status: 'FAILED',
      message: error.message
    });
  }
};

export const deleteTrainingRequest = async (req, res) => {
  try {
    const response = await trainingService.deleteTrainingRequest(req.params.id);
    res.json(response);
  } catch (error) {
    res.status(500).json({
      status: 'FAILED',
      message: error.message
    });
  }
};