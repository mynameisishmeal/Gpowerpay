import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import DeliveryPartner from '@/lib/models/DeliveryPartner';
import { requireAuth } from '@/lib/serverAuth';
import { NotificationService } from '@/lib/services/notificationService';

/**
 * POST /api/orders/[id]/assign-rider
 * Assign a rider to an order
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Verify user authentication
    const { user, error } = await requireAuth();
    if (error) return error;

    await connectDB();

    const body = await request.json();
    const { riderId } = body;

    console.log('🔍 Assign Rider API - Received Body:', body);
    console.log('🔍 Extracted riderId:', riderId);

    if (!riderId) {
      return NextResponse.json(
        { error: 'Rider ID is required' },
        { status: 400 }
      );
    }

    // Fetch the delivery partner
    const rider = await DeliveryPartner.findById(riderId);
    console.log('🔍 Found rider:', rider ? { id: rider._id, name: rider.name } : 'NOT FOUND');
    if (!rider) {
      return NextResponse.json({ error: 'Delivery partner not found' }, { status: 404 });
    }

    if (!rider.isActive) {
      return NextResponse.json(
        { error: 'Delivery partner is not active' },
        { status: 400 }
      );
    }

    // Fetch and update the order by _id
    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Verify user owns this order (unless admin)
    if (user.role !== 'admin' && user.role !== 'sadmin' && order.customerId.toString() !== user.id) {
      return NextResponse.json(
        { error: 'You can only assign riders to your own orders' },
        { status: 403 }
      );
    }

    // Verify rider type matches delivery type
    if (order.deliveryType && rider.partnerType !== order.deliveryType) {
      return NextResponse.json(
        {
          error: `This is a ${rider.partnerType} delivery partner, but the order requires a ${order.deliveryType} partner`,
        },
        { status: 400 }
      );
    }

    // Assign rider to order
    order.assignedRider = {
      riderId: rider._id.toString(),
      name: rider.name,
      phone: rider.phone,
      image: rider.image,
    };

    await order.save();

    // Send notification to customer
    await NotificationService.notifyRiderAssigned(
      order.customerId.toString(),
      order._id.toString(),
      order.customerEmail,
      order.customerName,
      order.orderNumber,
      order.confirmationCode,
      rider.name,
      rider.phone
    );

    // TODO: Send notification to admin about rider assignment
    console.log('📦 Rider Assigned:', {
      orderId: order.orderNumber,
      rider: rider.name,
      phone: rider.phone,
      deliveryType: order.deliveryType,
    });

    return NextResponse.json(
      {
        message: 'Rider assigned successfully',
        order: {
          orderNumber: order.orderNumber,
          assignedRider: order.assignedRider,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error assigning rider:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to assign rider' },
      { status: 500 }
    );
  }
}
