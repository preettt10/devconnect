// ============================================================
// server.js — DevConnect API Entry Point
// ============================================================

// ---- DNS fix: force IPv4 + Google DNS for Atlas SRV resolution ----
// Fixes "querySrv ECONNREFUSED" on networks that block DNS SRV lookups
import dns from 'dns';
if (process.env.NODE_ENV !== 'production') {
  dns.setDefaultResultOrder('ipv4first');
  dns.setServers(['8.8.8.8', '8.8.4.4']);
}

import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import connectDB from './config/db.js';
import { configureCloudinary } from './config/cloudinary.js';
import errorMiddleware from './middleware/error.middleware.js';
import { REQUIRED_ENV_VARS } from './constants.js';

// ---- Route imports ----
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import postRoutes from './routes/post.routes.js';
import commentRoutes from './routes/comment.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import { initSocket } from './socket/socket.js';

// ---- Validate required environment variables at startup ----
const missingVars = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
if (missingVars.length > 0) {
  console.error(`\n💀 Missing required environment variables:\n  ${missingVars.join('\n  ')}`);
  console.error('\nCopy backend/.env.example to backend/.env and fill in the values.\n');
  process.exit(1);
}

// ---- App setup ----
const app = express();
const server = http.createServer(app); // Needed for Socket.io

// ---- Security middleware ----
app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN,
    credentials: true, // Allow cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Rate limiting — higher in development to avoid local testing rate limits
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 10000 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
});
app.use('/api', limiter);

// ---- Parsing middleware ----
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ---- HTTP logging (skip in test) ----
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));
}

// ---- Health check ----
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ---- API Routes ----
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/posts', postRoutes);
app.use('/api/v1/comments', commentRoutes);
app.use('/api/v1/notifications', notificationRoutes);

// ---- 404 handler ----
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ---- Global error handler (must be last) ----
app.use(errorMiddleware);

// ---- Socket.io ----
initSocket(server, app);

// ---- Start server ----
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  configureCloudinary();

  server.listen(PORT, () => {
    console.log(`\n🚀 DevConnect API running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 Client origin: ${process.env.CLIENT_ORIGIN}\n`);
  });
};

startServer();

export { app, server };
