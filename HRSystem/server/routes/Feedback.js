import express from 'express';
import {
  getAllFeedback,
  getFeedbackById,
  getFeedbacksByEvaluationId,
  getFeedbacksByUserId,
  createFeedback,
  updateFeedback,
  deleteFeedback
} from '../controllers/FeedbackController.js';

const router = express.Router();

router.get('/', getAllFeedback);
router.get('/:id', getFeedbackById);
router.get('/evaluation/:evaluationId', getFeedbacksByEvaluationId);
router.get('/user/:userId', getFeedbacksByUserId);
router.post('/', createFeedback);
router.put('/:id', updateFeedback);
router.delete('/:id', deleteFeedback);

export default router;