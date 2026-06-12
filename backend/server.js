/**
 * server.js — Main entry point for Pizza Delivery App Backend
 * Initializes Express, MongoDB, Socket.io, and starts the HTTP server.
 */

require('dotenv').config();
require('express-async-errors');

const http = require('http');
const app = require('./app');
const { connectDB } = require('./config/db');
const { initializeSocket } = require('./config/socket');
const { startCronJobs } = require('./jobs/stockAlertJob');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

// Create HTTP server (needed for Socket.io)
const server = http.createServer(app);

// Initialize Socket.io
initializeSocket(server);

// Start cron jobs
startCronJobs();

// Start server after connecting to DB
const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
      logger.info(`📡 Socket.io ready for real-time connections`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! Shutting down...', err);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! Shutting down...', err);
  process.exit(1);
});
