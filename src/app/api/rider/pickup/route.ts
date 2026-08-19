import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import DeliveryPartner from '@/lib/models/DeliveryPartner';
import { auth } from '@/auth';
import { NotificationService } from '@/lib/services/notificationService';

/**
 * POST /api/rider/pickup
 * Mark an assigned order as picked up by the rider (order is now on the way to customer)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id || (session.user as any).role !== 'rider') {
      return NextResponse.json(
        { error: 'Unauthorized. Riders only.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find the delivery partner record for this logged in user
    const deliveryPartner = await DeliveryPartner.findOne({ userId: session.user.id });

    if (!deliveryPartner) {
      return NextResponse.json(
        { error: 'Delivery partner profile not found' },
        { status: 404 }
      );
    }

    // Find the order
    const order = await Order.findById(orderId);

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Verify this order is assigned to this rider
    if (order.assignedRider?.riderId !== deliveryPartner._id.toString()) {
      return NextResponse.json(
        { error: 'This order is not assigned to you' },
        { status: 403 }
      );
    }

    // Check if already delivered or cancelled
    if (['delivered', 'rider_delivered', 'sadmin_delivered', 'cancelled'].includes(order.deliveryStatus || '')) {
      return NextResponse.json(
        { error: `Cannot mark as picked up. Order is already ${order.deliveryStatus}` },
        { status: 400 }
      );
    }

    // Update status to on_the_way
    order.deliveryStatus = 'on_the_way';
    order.status = 'out_for_delivery';
    order.statusHistory.push({
      status: 'out_for_delivery',
      timestamp: new Date(),
      note: `Order picked up by rider ${deliveryPartner.name} and is on the way to customer`,
    });

    await order.save();

    // Send notification to customer that order is on the way
    try {
      await NotificationService.notifyDeliveryStatusChanged(
        order.customerId.toString(),
        order._id.toString(),
        order.customerEmail,
        order.customerName,
        order.orderNumber,
        order.confirmationCode,
        'on_the_way'
      );
    } catch (notifError) {
      console.error('Failed to send pickup notification:', notifError);
    }

    return NextResponse.json({
      success: true,
      message: 'Order marked as picked up and is now on the way to customer',
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        deliveryStatus: order.deliveryStatus,
        status: order.status,
      },
    });
  } catch (error: any) {
    console.error('Error marking order as picked up:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to mark order as picked up' },
      { status: 500 }
    );
  }
}
