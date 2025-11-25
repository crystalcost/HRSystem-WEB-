import express from 'express';
import {
  getAllTrainingRequests,
  getTrainingRequestById,
  getTrainingRequestsByUserId,
  getTrainingRequestsByStatus,
  createTrainingRequest,
  updateTrainingRequest,
  updateTrainingRequestStatus,
  deleteTrainingRequest
} from '../controllers/TrainingController.js';

const router = express.Router();

router.get('/', getAllTrainingRequests);
router.get('/:id', getTrainingRequestById);
router.get('/user/:userId', getTrainingRequestsByUserId);
router.get('/status/:status', getTrainingRequestsByStatus);
router.post('/', createTrainingRequest);
router.put('/:id', updateTrainingRequest);
router.put('/:id/status', updateTrainingRequestStatus);
router.delete('/:id', deleteTrainingRequest);

export default router;