import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import { requireAdmin } from '@/lib/serverAuth';

function generateConfirmationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * POST /api/admin/migrate-confirmation-codes
 * Add confirmation codes to orders that don't have them
 */
export async function POST() {
  try {
    // Verify admin auth
    const { error } = await requireAdmin();
    if (error) return error;

    await connectDB();

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
      return NextResponse.json({
        success: true,
        message: 'All orders already have confirmation codes!',
        updated: 0,
      });
    }

    const updates = [];
    for (const order of ordersWithoutCodes) {
      const code = generateConfirmationCode();
      order.confirmationCode = code;
      await order.save();
      updates.push({
        orderNumber: order.orderNumber,
        confirmationCode: code,
      });
      console.log(`✅ Updated order ${order.orderNumber} with code ${code}`);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${updates.length} orders with confirmation codes`,
      updated: updates.length,
      orders: updates,
    });
  } catch (error: any) {
    console.error('❌ Migration failed:', error);
    return NextResponse.json(
      { error: error.message || 'Migration failed' },
      { status: 500 }
    );
  }
}
