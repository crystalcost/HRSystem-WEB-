import express from 'express';
import {
  getAllEvaluations,
  getEvaluationById,
  getUserEvaluations,
  getManagerEvaluations,
  getManagerEmployeeEvaluations,
  createEvaluation,
  updateEvaluation,
  deleteEvaluation
} from '../controllers/EvaluationController.js';

const router = express.Router();

router.get('/', getAllEvaluations);
router.get('/:id', getEvaluationById);
router.get('/user/:userId', getUserEvaluations);
router.get('/manager/:managerId', getManagerEvaluations);
router.get('/manager/:managerId/employee/:employeeId', getManagerEmployeeEvaluations);
router.post('/', createEvaluation);
router.put('/:id', updateEvaluation);
router.delete('/:id', deleteEvaluation);

export default router;