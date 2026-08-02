import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import { requireAdmin } from '@/lib/serverAuth';
import { NotificationService } from '@/lib/services/notificationService';

/**
 * PATCH /api/orders/[id]/delivery-status
 * Update order delivery status (Admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Verify admin authentication
    const { error } = await requireAdmin();
    if (error) return error;

    await connectDB();

    const body = await request.json();
    const { deliveryStatus } = body;

    if (!deliveryStatus || !['in_store', 'on_the_way', 'delivered'].includes(deliveryStatus)) {
      return NextResponse.json(
        { error: 'Invalid delivery status' },
        { status: 400 }
      );
    }

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    order.deliveryStatus = deliveryStatus;
    
    // If delivered, also update main order status
    if (deliveryStatus === 'delivered') {
      order.status = 'delivered';
      order.completedAt = new Date();
    }

    await order.save();

    // Send notification to customer
    await NotificationService.notifyDeliveryStatusChanged(
      order.customerId.toString(),
      order._id.toString(),
      order.customerEmail,
      order.customerName,
      order.orderNumber,
      order.confirmationCode,
      deliveryStatus
    );

    return NextResponse.json(
      {
        message: 'Delivery status updated successfully',
        order: {
          orderNumber: order.orderNumber,
          deliveryStatus: order.deliveryStatus,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating delivery status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update delivery status' },
      { status: 500 }
    );
  }
}
