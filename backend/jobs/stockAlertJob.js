const cron = require('node-cron');
const Inventory = require('../models/Inventory');
const { sendLowStockAlert } = require('../services/emailService');
const logger = require('../utils/logger');

const checkLowStock = async () => {
  try {
    logger.info('🕐 Running low stock check...');

    const lowStockItems = await Inventory.find({
      $expr: { $lte: ['$quantity', '$threshold'] },
      isAvailable: false,
    });

    const approachingThreshold = await Inventory.find({
      $expr: {
        $and: [
          { $lte: ['$quantity', { $multiply: ['$threshold', 1.2] }] },
          { $gt: ['$quantity', '$threshold'] },
        ],
      },
    });

    const allLowStock = [...lowStockItems, ...approachingThreshold];

    if (allLowStock.length > 0) {
      const adminEmail = process.env.ADMIN_EMAIL;
      if (!adminEmail) {
        logger.warn('⚠️  ADMIN_EMAIL not set. Skipping low stock email.');
        return;
      }

      const result = await sendLowStockAlert(adminEmail, allLowStock);
      if (result.success) {
        logger.info(`📧 Low stock alert sent to ${adminEmail} for ${allLowStock.length} item(s)`);
      } else {
        logger.error('Failed to send low stock alert email:', result.error);
      }
    } else {
      logger.info('✅ All inventory levels are healthy');
    }
  } catch (error) {
    logger.error('❌ Low stock check failed:', error);
  }
};

const startCronJobs = () => {

  cron.schedule('0 * * * *', checkLowStock, {
    scheduled: true,
    timezone: 'Asia/Kolkata',
  });

  logger.info('⏰ Cron job scheduled: Low stock check every hour');

  if (process.env.NODE_ENV === 'development') {
    setTimeout(checkLowStock, 5000);
  }
};

module.exports = { startCronJobs, checkLowStock };
