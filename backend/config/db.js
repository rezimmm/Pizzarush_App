const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Modern Mongoose doesn't need deprecated options
    });

    logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Log when disconnected
    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('✅ MongoDB reconnected');
    });

  } catch (error) {
    logger.error(`❌ MongoDB Connection Error: ${error.message}`);
    throw error;
  }
};

module.exports = { connectDB };
