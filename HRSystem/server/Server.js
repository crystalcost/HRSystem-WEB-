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

connectDB();

app.use('/api/auth', AuthRoutes);
app.use('/api/users', UserRoutes);
app.use('/api/evaluations', EvaluationRoutes);
app.use('/api/feedback', FeedbackRoutes);
app.use('/api/self-assessments', SelfAssessmentRoutes);
app.use('/api/training-requests', TrainingRoutes);

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
  console.error('Unhandled error:', error);
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
  console.log(`HR System Server running on http://localhost:${PORT}`);
});