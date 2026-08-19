import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { OrderService } from '@/lib/services/orderService';

/**
 * GET /api/orders/[id] - Get single order
 */
export async function GET(
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

    const { id } = await params;

    // Customers can only see their own orders. Riders/Admins can see any order (or are restricted later).
    const userRole = (session.user as any).role || 'customer';
    const isCustomer = userRole === 'customer';
    const customerId = isCustomer ? session.user.id : undefined;

    const order = await OrderService.getOrderById(id, customerId);

    let orderPayload = order;
    if (userRole === 'rider') {
      const DeliveryPartner = (await import('@/lib/models/DeliveryPartner')).default;
      const deliveryPartner = await DeliveryPartner.findOne({ userId: session.user.id });

      if (!deliveryPartner || order.assignedRider?.riderId !== deliveryPartner._id.toString()) {
        return NextResponse.json(
          { error: 'Access denied. You are not assigned to this order.' },
          { status: 403 }
        );
      }

      // Strip confirmation code if rider
      const { confirmationCode, ...rest } = orderPayload;
      orderPayload = rest as any;
    }

    return NextResponse.json({
      success: true,
      order: orderPayload,
    });
  } catch (error: any) {
    console.error('Get order error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get order' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/orders/[id] - Cancel order
 */
export async function DELETE(
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
    const reason = body.reason || 'Customer cancelled';

    const { id } = await params;
    const order = await OrderService.cancelOrder(
      id,
      session.user.id,
      reason
    );

    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully',
      order,
    });
  } catch (error: any) {
    console.error('Cancel order error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cancel order' },
      { status: 500 }
    );
  }
}
