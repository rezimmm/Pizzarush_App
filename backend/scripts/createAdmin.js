require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const ADMIN_EMAIL    = 'admin@pizzarush.com';
const ADMIN_PASSWORD = 'Admin@1234';   // change after first login
const ADMIN_NAME     = 'Admin';

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  let user = await User.findOne({ email: ADMIN_EMAIL }).select('+password');

  if (user) {
    // Already exists — just promote to admin
    user.role = 'admin';
    user.isVerified = true;
    user.isActive = true;
    await user.save({ validateBeforeSave: false });
    console.log(`✅ Existing user "${ADMIN_EMAIL}" promoted to admin.`);
  } else {
    // Create fresh admin user
    user = await User.create({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: 'admin',
      isVerified: true,
      isActive: true,
    });
    console.log(`✅ Admin user created: ${ADMIN_EMAIL}`);
  }

  console.log('\n─────────────────────────────');
  console.log('  Login credentials');
  console.log('─────────────────────────────');
  console.log(`  Email   : ${ADMIN_EMAIL}`);
  console.log(`  Password: ${ADMIN_PASSWORD}`);
  console.log(`  Role    : admin`);
  console.log('─────────────────────────────\n');

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
