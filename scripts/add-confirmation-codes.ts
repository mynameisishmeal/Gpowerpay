/**
 * Migration Script: Add Confirmation Codes to Existing Orders
 * Run with: npx tsx scripts/add-confirmation-codes.ts
 */

import connectDB from '../lib/mongodb';
import Order from '../models/Order';

async function generateConfirmationCode(): Promise<string> {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function addConfirmationCodes() {
  try {
    await connectDB();
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
      process.exit(0);
    }

    let updated = 0;
    for (const order of ordersWithoutCodes) {
      const code = await generateConfirmationCode();
      order.confirmationCode = code;
      await order.save();
      updated++;
      console.log(`✅ Updated order ${order.orderNumber} with code ${code}`);
    }

    console.log(`\n🎉 Successfully updated ${updated} orders with confirmation codes!`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

addConfirmationCodes();
