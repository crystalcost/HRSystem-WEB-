import express from 'express';
import {
  getAllUsers,
  getUserById,
  getUserByUsername,
  createUser,
  updateUser,
  adminUpdatePassword,
  updatePassword,
  deleteUser,
  getAllManagers
} from '../controllers/UserController.js';

const router = express.Router();

router.get('/', getAllUsers);
router.get('/managers', getAllManagers);
router.get('/:id', getUserById);
router.get('/username/:username', getUserByUsername);
router.post('/', createUser);
router.put('/:id', updateUser);
router.put('/:id/admin-password', adminUpdatePassword);
router.post('/:id/password', updatePassword);
router.delete('/:id', deleteUser);

export default router;