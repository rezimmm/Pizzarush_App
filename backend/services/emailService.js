const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

let transporter;

const createTransporter = async () => {
  if (transporter) return transporter;

  if (process.env.NODE_ENV === 'development' && process.env.EMAIL_HOST === 'smtp.ethereal.email') {

    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    logger.info(`📧 Ethereal Email created. Preview at: https://ethereal.email`);
    logger.info(`   User: ${testAccount.user} | Pass: ${testAccount.pass}`);
  } else {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: Number(process.env.EMAIL_PORT) === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  return transporter;
};

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transport = await createTransporter();
    const info = await transport.sendMail({
      from: process.env.EMAIL_FROM || '"PizzaHub 🍕" <no-reply@pizzahub.com>',
      to,
      subject,
      text: text || '',
      html,
    });

    if (process.env.NODE_ENV === 'development') {
      logger.info(`📧 Email sent: ${info.messageId}`);
      logger.info(`   Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('Email sending failed:', error);
    return { success: false, error: error.message };
  }
};

const emailBase = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>PizzaHub</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f7f7f7; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 30px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #ff4500, #ff6b35); padding: 30px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 28px; letter-spacing: 1px; }
    .header p { color: rgba(255,255,255,0.9); margin: 5px 0 0; }
    .body { padding: 30px 40px; color: #333; line-height: 1.6; }
    .body h2 { color: #ff4500; margin-top: 0; }
    .btn { display: inline-block; background: linear-gradient(135deg, #ff4500, #ff6b35); color: white !important; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; margin: 20px 0; }
    .footer { background: #f7f7f7; padding: 20px 40px; text-align: center; color: #999; font-size: 13px; border-top: 1px solid #eee; }
    .divider { border: none; border-top: 1px solid #eee; margin: 20px 0; }
    .highlight { background: #fff5f2; border-left: 4px solid #ff4500; padding: 12px 16px; border-radius: 4px; margin: 16px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🍕 PizzaHub</h1>
      <p>Fresh, Fast & Delicious</p>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} PizzaHub. All rights reserved.</p>
      <p>If you didn't request this email, please ignore it.</p>
    </div>
  </div>
</body>
</html>`;

const sendVerificationEmail = async (user, verificationUrl) => {
  const html = emailBase(`
    <h2>Verify Your Email 📧</h2>
    <p>Hi <strong>${user.name}</strong>,</p>
    <p>Welcome to PizzaHub! 🎉 You're just one step away from ordering the most delicious pizzas.</p>
    <p>Please click the button below to verify your email address:</p>
    <div style="text-align: center;">
      <a href="${verificationUrl}" class="btn">Verify My Email</a>
    </div>
    <div class="highlight">
      <strong>⏰ This link expires in 24 hours.</strong>
    </div>
    <p>Or copy and paste this URL in your browser:</p>
    <p style="word-break: break-all; color: #ff4500; font-size: 13px;">${verificationUrl}</p>
  `);

  return sendEmail({ to: user.email, subject: '✅ Verify Your PizzaHub Account', html });
};

const sendPasswordResetEmail = async (user, resetUrl) => {
  const html = emailBase(`
    <h2>Reset Your Password 🔐</h2>
    <p>Hi <strong>${user.name}</strong>,</p>
    <p>We received a request to reset your PizzaHub account password.</p>
    <div style="text-align: center;">
      <a href="${resetUrl}" class="btn">Reset Password</a>
    </div>
    <div class="highlight">
      <strong>⏰ This link expires in 1 hour.</strong>
    </div>
    <p>If you didn't request this, you can safely ignore this email. Your password won't change.</p>
  `);

  return sendEmail({ to: user.email, subject: '🔐 Reset Your PizzaHub Password', html });
};

const sendOrderConfirmationEmail = async (user, order) => {
  const itemRows = order.items.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹${item.totalPrice}</td>
    </tr>
  `).join('');

  const html = emailBase(`
    <h2>Order Confirmed! 🎉</h2>
    <p>Hi <strong>${user.name}</strong>,</p>
    <p>Your order has been placed and is being prepared. Get ready for deliciousness!</p>
    <div class="highlight">
      <strong>Order ID:</strong> ${order.orderId}<br/>
      <strong>Status:</strong> Order Received
    </div>
    <h3 style="color: #ff4500;">Order Summary</h3>
    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
      <thead>
        <tr style="background: #fff5f2;">
          <th style="padding: 10px 8px; text-align: left;">Item</th>
          <th style="padding: 10px 8px; text-align: center;">Qty</th>
          <th style="padding: 10px 8px; text-align: right;">Price</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
      <tfoot>
        <tr>
          <td colspan="2" style="padding: 10px 8px; font-weight: bold; text-align: right;">Total:</td>
          <td style="padding: 10px 8px; font-weight: bold; text-align: right; color: #ff4500;">₹${order.totalAmount}</td>
        </tr>
      </tfoot>
    </table>
    <p>You can track your order in real-time from your dashboard. 🚀</p>
  `);

  return sendEmail({ to: user.email, subject: `🍕 Order Confirmed! #${order.orderId}`, html });
};

const sendOrderDeliveredEmail = async (user, order) => {
  const html = emailBase(`
    <h2>Your Order Has Been Delivered! 🚀</h2>
    <p>Hi <strong>${user.name}</strong>,</p>
    <p>Great news! Your order <strong>#${order.orderId}</strong> has been delivered successfully.</p>
    <p>We hope you enjoy every bite! 😋</p>
    <p>Don't forget to rate your experience on the app.</p>
    <hr class="divider" />
    <p style="color: #999; font-size: 13px;">Thank you for choosing PizzaHub! 🍕</p>
  `);

  return sendEmail({ to: user.email, subject: `🚀 Delivered! Order #${order.orderId}`, html });
};

const sendLowStockAlert = async (adminEmail, stockItems) => {
  const itemRows = stockItems.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.itemName}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-transform: capitalize;">${item.category}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center; color: #e53e3e; font-weight: bold;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.threshold}</td>
    </tr>
  `).join('');

  const html = emailBase(`
    <h2>⚠️ Low Stock Alert</h2>
    <p>The following inventory items are below their threshold levels and need to be restocked:</p>
    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
      <thead>
        <tr style="background: #fff5f2;">
          <th style="padding: 10px 8px; text-align: left;">Item</th>
          <th style="padding: 10px 8px; text-align: left;">Category</th>
          <th style="padding: 10px 8px; text-align: center;">Current Stock</th>
          <th style="padding: 10px 8px; text-align: center;">Threshold</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>
    <div class="highlight" style="margin-top: 20px;">
      <strong>⏰ Checked at:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
    </div>
    <p>Please log in to the admin panel to update inventory levels.</p>
  `);

  return sendEmail({
    to: adminEmail,
    subject: `⚠️ PizzaHub Low Stock Alert - ${stockItems.length} item(s) need attention`,
    html
  });
};

const sendNewOrderNotificationToAdmin = async (adminEmail, order, user) => {
  const html = emailBase(`
    <h2>🆕 New Order Received!</h2>
    <p>A new order has been placed on PizzaHub.</p>
    <div class="highlight">
      <strong>Order ID:</strong> ${order.orderId}<br/>
      <strong>Customer:</strong> ${user.name} (${user.email})<br/>
      <strong>Amount:</strong> ₹${order.totalAmount}<br/>
      <strong>Items:</strong> ${order.items.length} item(s)
    </div>
    <p>Please log in to the admin panel to manage this order.</p>
  `);

  return sendEmail({
    to: adminEmail,
    subject: `🆕 New Order #${order.orderId} - ₹${order.totalAmount}`,
    html
  });
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
  sendOrderDeliveredEmail,
  sendLowStockAlert,
  sendNewOrderNotificationToAdmin,
};
