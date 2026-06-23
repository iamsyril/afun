import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import router from './routes/Routes.js';
import { configureSockets } from './services/socket.js';

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

app.use(cors({
  origin: '*', // Allow all origins for the Flutter client (including mobile/emulator)
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// API Routes
app.use('/api', router);

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Root fallback
app.get('/', (req, res) => {
  res.send('FUNC HERO - API & Socket server is running.');
});

// Error handling middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

const PORT = process.env.PORT || 5000;

const httpServer = http.createServer(app);

// Socket.IO Server configuration
const io = new Server(httpServer, {
  pingTimeout: 60000,
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

configureSockets(io);

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
