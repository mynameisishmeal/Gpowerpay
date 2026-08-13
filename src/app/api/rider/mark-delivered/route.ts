import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import DeliveryPartner from '@/lib/models/DeliveryPartner';
import { auth } from '@/auth';
import { NotificationService } from '@/lib/services/notificationService';

/**
 * POST /api/rider/mark-delivered
 * Mark an order as delivered (riders only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== 'rider') {
      return NextResponse.json(
        { error: 'Unauthorized. Riders only.' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { orderId, confirmationCode } = body;

    if (!orderId || !confirmationCode) {
      return NextResponse.json(
        { error: 'Order ID and confirmation code are required' },
        { status: 400 }
      );
    }

    // Find the delivery partner record for this user
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

    // Verify confirmation code
    if (order.confirmationCode !== confirmationCode) {
      return NextResponse.json(
        { error: 'Invalid confirmation code' },
        { status: 400 }
      );
    }

    if (order.deliveryStatus === 'sadmin_delivered') {
      // Both parties have now confirmed
      order.deliveryStatus = 'delivered';
      order.status = 'delivered';
      order.completedAt = new Date();
      order.statusHistory.push({
        status: 'delivered',
        timestamp: new Date(),
        note: `Delivery confirmed by both Admin and rider ${deliveryPartner.name}`,
      });
      await order.save();

      // Send standard delivered notification to customer
      await NotificationService.notifyDeliveryStatusChanged(
        order.customerId.toString(),
        order._id.toString(),
        order.customerEmail,
        order.customerName,
        order.orderNumber,
        order.confirmationCode,
        'delivered'
      );
    } else {
      // Only rider confirmed
      // Update delivery status and overall status to rider_delivered
      order.deliveryStatus = 'rider_delivered';
      order.status = 'rider_delivered';
      order.statusHistory.push({
        status: 'rider_delivered',
        timestamp: new Date(),
        note: `Marked as delivered by rider ${deliveryPartner.name} (Waiting for Customer or Admin)`,
      });
      await order.save();

      // Send action_required notification to customer to Accept or Dispute
      await NotificationService.createNotification({
        userId: order.customerId.toString(),
        type: 'action_required',
        title: 'Action Required: Confirm Delivery',
        message: `Your rider has marked order #${order.orderNumber} as delivered. Please review and Accept or Dispute the delivery.`,
        data: {
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
          deliveryStatus: 'rider_delivered'
        },
        sendEmail: true,
        userEmail: order.customerEmail,
        userName: order.customerName,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Order marked as delivered successfully',
    });
  } catch (error: any) {
    console.error('Error marking order as delivered:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to mark order as delivered' },
      { status: 500 }
    );
  }
}
