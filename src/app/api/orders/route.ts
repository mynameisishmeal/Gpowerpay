import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { OrderService } from '@/lib/services/orderService';
import { NotificationService } from '@/lib/services/notificationService';

/**
 * GET /api/orders - Get customer orders
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const result = await OrderService.getCustomerOrders(
      session.user.id,
      page,
      limit
    );

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('Get orders error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get orders' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/orders - Create new order
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (session.user.role === 'rider') {
      return NextResponse.json(
        { error: 'Forbidden. Riders cannot place orders.' },
        { status: 403 }
      );
    }

    const body = await request.json();

    console.log('📦 Received order data:', JSON.stringify(body, null, 2));
    console.log('📦 Items received:', body.items);

    // Create order
    const order = await OrderService.createOrder({
      customerId: session.user.id,
      customerName: session.user.name || '',
      customerEmail: session.user.email || '',
      customerPhone: body.customerPhone,
      items: body.items,
      subtotal: body.subtotal,
      deliveryFee: body.deliveryFee,
      total: body.total,
      deliveryOption: body.deliveryOption,
      deliveryType: body.deliveryType, // Add delivery type
      deliveryAddress: body.deliveryAddress,
      deliveryDate: body.deliveryDate,
      pickupDate: body.pickupDate,
      paymentMethod: body.paymentMethod,
      notes: body.customerNote,
    });

    // Process payment
    const paymentReference = body.paymentReference || `PAY-${order.orderNumber}`;
    await OrderService.processPayment(
      order._id.toString(),
      body.paymentMethod,
      paymentReference,
      body.walletAmount,
      body.paystackAmount
    );

    // Send notification
    await NotificationService.notifyOrderPlaced(
      session.user.id,
      order._id.toString(),
      session.user.email || '',
      session.user.name || '',
      order.orderNumber,
      order.confirmationCode,
      order.total
    );

    return NextResponse.json({
      success: true,
      message: 'Order created successfully',
      order: {
        orderId: order._id,
        orderNumber: order.orderNumber,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create order error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 500 }
    );
  }
}
