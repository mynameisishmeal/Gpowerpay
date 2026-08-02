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

    // Update delivery status
    order.deliveryStatus = 'delivered';
    await order.save();

    // Send notification to customer
    await NotificationService.notifyDeliveryStatusChanged(
      order.customerId.toString(),
      order._id.toString(),
      order.customerEmail,
      order.customerName,
      order.orderNumber,
      order.confirmationCode,
      'delivered'
    );

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
