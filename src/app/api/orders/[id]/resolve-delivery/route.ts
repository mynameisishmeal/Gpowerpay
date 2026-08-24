import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import Notification from '@/lib/models/Notification';
import Ticket from '@/models/Ticket';
import User from '@/models/User';
import { NotificationService } from '@/lib/services/notificationService';

/**
 * POST /api/orders/[id]/resolve-delivery
 * Customer accepts or disputes a delivery after the rider marks it as delivered
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, reason } = body;

    if (!action || !['accept', 'dispute'].includes(action)) {
      return NextResponse.json(
        { error: 'Valid action (accept or dispute) is required' },
        { status: 400 }
      );
    }

    const { id } = await params;
    await connectDB();

    const order = await Order.findOne({
      _id: id,
      customerId: session.user.id
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Must be in rider_delivered or sadmin_delivered state to resolve
    if (order.status !== 'rider_delivered' && order.status !== 'sadmin_delivered') {
      return NextResponse.json(
        { error: 'Order is not waiting for delivery confirmation' },
        { status: 400 }
      );
    }

    if (action === 'accept') {
      order.status = 'delivered';
      order.deliveryStatus = 'delivered';
      order.completedAt = new Date();
      order.statusHistory.push({
        status: 'delivered',
        timestamp: new Date(),
        note: 'Customer accepted delivery',
      });
    } else if (action === 'dispute') {
      order.status = 'disputed';
      order.deliveryStatus = 'disputed';
      order.statusHistory.push({
        status: 'disputed',
        timestamp: new Date(),
        note: `Customer disputed delivery. Reason: ${reason || 'No reason provided'}`,
      });
      // Optionally store in a dedicated field if needed
      order.cancelReason = reason || 'Disputed delivery';
      
      // CREATE A SUPPORT TICKET FOR THE DISPUTE
      const ticket = new Ticket({
        customer: session.user.id,
        subject: `Disputed Delivery - Order #${order.orderNumber}`,
        description: `Customer disputed the delivery.\n\nReason: ${reason || 'No reason provided'}\n\nPlease investigate this order.`,
        priority: 'high',
        status: 'open',
        relatedOrder: order._id,
        messages: [{
          sender: session.user.id,
          message: `I am disputing this delivery. Reason: ${reason || 'No reason provided'}`,
        }]
      });
      await ticket.save();

      // NOTIFY ALL ADMINS AND SADMINS ABOUT THE NEW TICKET
      const admins = await User.find({ role: { $in: ['sadmin', 'admin', 'support'] } }).select('_id');
      for (const admin of admins) {
        await NotificationService.createNotification({
          userId: admin._id.toString(),
          title: 'New Dispute Ticket',
          message: `Order #${order.orderNumber} has been disputed.`,
          type: 'new_ticket',
          data: {
            ticketId: ticket._id.toString(),
            orderId: order._id.toString()
          }
        });
      }
    }

    await order.save();

    // Mark the action_required notification as read if it exists
    await Notification.updateMany(
      {
        userId: session.user.id,
        type: 'action_required',
        'data.orderId': order._id.toString(),
        read: false,
      },
      { read: true }
    );

    return NextResponse.json({
      success: true,
      message: action === 'accept' ? 'Delivery accepted successfully' : 'Delivery disputed successfully',
      order,
    });
  } catch (error: any) {
    console.error('Resolve delivery error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to resolve delivery' },
      { status: 500 }
    );
  }
}
