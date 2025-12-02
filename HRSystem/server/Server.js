import express from 'express';
import cors from 'cors';
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

app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:8080'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['*'],
  credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client')));
app.use('/api', (req, res, next) => {
    console.log(`[API Запрос] ${req.method} ${req.path}`, req.body && Object.keys(req.body).length > 0 ? { body: req.body } : '');
    const originalJson = res.json;
    res.json = function(data) {
        console.log(`[API Ответ] ${req.method} ${req.path}`, data);
        return originalJson.call(this, data);
    };
    next();
});
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
    message: 'HR System Server is running',
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