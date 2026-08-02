import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import { requireAdmin } from '@/lib/serverAuth';

/**
 * GET /api/admin/orders/[id] - Get single order (Admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { id } = await params;
    await connectDB();

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error: any) {
    console.error('Get admin order error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get order' },
      { status: 500 }
    );
  }
}
