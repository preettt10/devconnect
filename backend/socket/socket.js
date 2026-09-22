// ============================================================
// socket/socket.js — Socket.io server setup and event handlers
// ============================================================

import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';

/**
 * Initializes Socket.io on the HTTP server.
 * Attaches the `io` instance to the Express app for use in controllers.
 *
 * @param {import('http').Server} server - The HTTP server instance
 * @param {import('express').Application} app - The Express app
 */
export const initSocket = (server, app) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_ORIGIN,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    connectionStateRecovery: {
      // Clients can recover their state after a brief disconnect
      maxDisconnectionDuration: 2 * 60 * 1000,
    },
  });

  // ---- Middleware: authenticate socket connection via JWT ----
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error('Authentication token missing'));
      }

      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      const user = await User.findById(decoded.id).select('_id username name avatar').lean();

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user; // Attach user to socket instance
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  // ---- Connection handler ----
  io.on('connection', async (socket) => {
    const userId = socket.user._id.toString();

    console.log(`🔌 Socket connected: ${socket.user.username} (${userId})`);

    // ---- Join personal room (for targeted notifications) ----
    socket.on('user:join', async () => {
      socket.join(userId);

      // Mark user as online in DB
      await User.findByIdAndUpdate(userId, { isOnline: true });

      // Broadcast online status to all connected clients
      io.emit('user:online', {
        userId,
        username: socket.user.username,
        name: socket.user.name,
        avatar: socket.user.avatar,
      });

      console.log(`👤 ${socket.user.username} joined room ${userId}`);
    });

    // ---- Disconnect handler ----
    socket.on('disconnect', async (reason) => {
      console.log(`🔌 Socket disconnected: ${socket.user.username} — ${reason}`);

      // Mark user as offline in DB
      await User.findByIdAndUpdate(userId, {
        isOnline: false,
        lastSeen: new Date(),
      });

      // Broadcast offline status
      io.emit('user:offline', {
        userId,
        username: socket.user.username,
        lastSeen: new Date(),
      });
    });

    // ---- Error handler per socket ----
    socket.on('error', (err) => {
      console.error(`Socket error for ${socket.user.username}:`, err.message);
    });
  });

  // Attach io to Express app for use in controllers
  app.set('io', io);

  console.log('✅ Socket.io initialized');

  return io;
};
