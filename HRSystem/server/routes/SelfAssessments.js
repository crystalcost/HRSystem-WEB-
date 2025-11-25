import express from 'express';
import {
  getAllSelfAssessments,
  getSelfAssessmentById,
  getSelfAssessmentsByUserId,
  createSelfAssessment,
  updateSelfAssessment,
  deleteSelfAssessment
} from '../controllers/SelfAssessmentController.js';

const router = express.Router();

router.get('/', getAllSelfAssessments);
router.get('/:id', getSelfAssessmentById);
router.get('/user/:userId', getSelfAssessmentsByUserId);
router.post('/', createSelfAssessment);
router.put('/:id', updateSelfAssessment);
router.delete('/:id', deleteSelfAssessment);

export default router;