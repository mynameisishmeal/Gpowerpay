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

    if (!deliveryStatus || !['in_store', 'on_the_way', 'sadmin_delivered'].includes(deliveryStatus)) {
      return NextResponse.json(
        { error: 'Invalid delivery status' },
        { status: 400 }
      );
    }

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (deliveryStatus === 'sadmin_delivered') {
      if (order.deliveryStatus === 'rider_delivered') {
        // Both parties have now confirmed
        order.deliveryStatus = 'delivered';
        order.status = 'delivered';
        order.completedAt = new Date();
        order.statusHistory.push({
          status: 'delivered',
          timestamp: new Date(),
          note: 'Delivery confirmed by both Admin and Rider',
        });
      } else {
        // Only admin confirmed
        order.deliveryStatus = 'sadmin_delivered';
        order.status = 'sadmin_delivered';
        order.statusHistory.push({
          status: 'sadmin_delivered',
          timestamp: new Date(),
          note: 'Marked as delivered by Admin (Waiting for Rider)',
        });
      }
    } else {
      order.deliveryStatus = deliveryStatus;
      if (deliveryStatus === 'on_the_way') {
        order.status = 'out_for_delivery';
        order.statusHistory.push({
          status: 'out_for_delivery',
          timestamp: new Date(),
          note: 'Order is out for delivery',
        });
      }
    }

    await order.save();

    // Send notification to customer using the computed deliveryStatus
    await NotificationService.notifyDeliveryStatusChanged(
      order.customerId.toString(),
      order._id.toString(),
      order.customerEmail,
      order.customerName,
      order.orderNumber,
      order.confirmationCode,
      order.deliveryStatus || 'in_store'
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
