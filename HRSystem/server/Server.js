import express from 'express';
import cors from './middleware/Cors.js';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import AuthRoutes from './routes/Auth.js';
import UserRoutes from './routes/Users.js';
import EvaluationRoutes from './routes/Evaluations.js';
import FeedbackRoutes from './routes/Feedback.js';
import SelfAssessmentRoutes from './routes/SelfAssessments.js';
import TrainingRoutes from './routes/Training.js';
import { connectDB } from './config/Database.js';
import { authenticateToken } from './middleware/Auth.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors);
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client')));

connectDB();

app.use('/api/auth', AuthRoutes);
app.use('/api/users', authenticateToken, UserRoutes);
app.use('/api/evaluations', authenticateToken, EvaluationRoutes);
app.use('/api/feedback', authenticateToken, FeedbackRoutes);
app.use('/api/self-assessments', authenticateToken, SelfAssessmentRoutes);
app.use('/api/training-requests', authenticateToken, TrainingRoutes);

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'HR System Server выполняется.',
    timestamp: new Date().toISOString()
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

app.use((error, req, res, next) => {
  console.error('Необработанная ошибка сервера:', error);
  res.status(500).json({ 
    status: 'FAILED', 
    message: 'Внутренняя ошибка сервера' 
  });
});

app.use((req, res) => {
  res.status(404).json({ 
    status: 'FAILED', 
    message: 'Ресурс не найден' 
  });
});

app.listen(PORT, () => {
  console.log(`Сервер HR System запущен на http://localhost:${PORT}`);
});