/**
 * config/socket.js — Socket.io initialization and event handling
 * Manages real-time order status updates pushed from admin to customers.
 */

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
  });

  // ─── Authentication Middleware for Sockets ─────────────────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  // ─── Connection Handler ────────────────────────────────────────────────────
  io.on('connection', (socket) => {
    logger.info(`🔌 Socket connected: ${socket.id} | User: ${socket.userId}`);

    // User joins their personal room to receive order updates
    socket.on('join_user_room', (userId) => {
      if (userId === socket.userId) {
        socket.join(`user_${userId}`);
        logger.info(`👤 User ${userId} joined their room`);
      }
    });

    // Admin joins admin room
    socket.on('join_admin_room', () => {
      if (socket.userRole === 'admin') {
        socket.join('admin_room');
        logger.info(`👑 Admin ${socket.userId} joined admin room`);
      }
    });

    // Join specific order room for tracking
    socket.on('track_order', (orderId) => {
      socket.join(`order_${orderId}`);
      logger.info(`📦 User tracking order: ${orderId}`);
    });

    socket.on('disconnect', (reason) => {
      logger.info(`🔌 Socket disconnected: ${socket.id} | Reason: ${reason}`);
    });

    socket.on('error', (error) => {
      logger.error(`Socket error: ${error.message}`);
    });
  });

  logger.info('✅ Socket.io initialized');
  return io;
};

// Get io instance (for use in controllers)
const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

module.exports = { initializeSocket, getIO };
