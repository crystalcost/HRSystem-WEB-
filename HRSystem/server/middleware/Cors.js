import cors from 'cors';

const corsOptions = {
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:8080', 'http://127.0.0.1:5500'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['*','Content-Type', 'Authorization'],
  credentials: true,
};

export default cors(corsOptions);