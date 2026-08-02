/**
 * Migration Script: Add Confirmation Codes to Existing Orders
 * Run with: node scripts/add-confirmation-codes.js
 */

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

// Order Schema
const OrderSchema = new mongoose.Schema({
  orderNumber: String,
  confirmationCode: String,
}, { strict: false });

const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);

function generateConfirmationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function addConfirmationCodes() {
  try {
    // Connect to database
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to database');

    // Find all orders without confirmation codes
    const ordersWithoutCodes = await Order.find({
      $or: [
        { confirmationCode: { $exists: false } },
        { confirmationCode: null },
        { confirmationCode: '' }
      ]
    });

    console.log(`📦 Found ${ordersWithoutCodes.length} orders without confirmation codes`);

    if (ordersWithoutCodes.length === 0) {
      console.log('✅ All orders already have confirmation codes!');
      await mongoose.disconnect();
      process.exit(0);
    }

    let updated = 0;
    for (const order of ordersWithoutCodes) {
      const code = generateConfirmationCode();
      order.confirmationCode = code;
      await order.save();
      updated++;
      console.log(`✅ Updated order ${order.orderNumber} with code ${code}`);
    }

    console.log(`\n🎉 Successfully updated ${updated} orders with confirmation codes!`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

addConfirmationCodes();
