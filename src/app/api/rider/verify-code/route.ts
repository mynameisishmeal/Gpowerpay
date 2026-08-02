import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import { populateOrderProductNames } from '@/lib/utils/orderUtils';

/**
 * POST /api/rider/verify-code
 * Verify confirmation code and return order details (public endpoint for riders)
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { confirmationCode } = body;

    if (!confirmationCode) {
      return NextResponse.json(
        { error: 'Confirmation code is required' },
        { status: 400 }
      );
    }

    // Find order by confirmation code
    const order = await Order.findOne({ confirmationCode }).lean();

    if (!order) {
      return NextResponse.json(
        { error: 'Invalid confirmation code. Please check and try again.' },
        { status: 404 }
      );
    }

    // Populate product names
    const orderWithNames = await populateOrderProductNames(order);

    // Return only necessary information for the rider
    return NextResponse.json({
      success: true,
      order: {
        orderNumber: orderWithNames.orderNumber,
        customerName: orderWithNames.customerName,
        customerPhone: orderWithNames.customerPhone,
        deliveryAddress: orderWithNames.deliveryAddress,
        deliveryType: orderWithNames.deliveryType,
        items: orderWithNames.items.map((item: any) => ({
          productName: item.productName,
          quantity: item.quantity,
        })),
        total: orderWithNames.total,
      },
    });
  } catch (error: any) {
    console.error('Verify code error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify code' },
      { status: 500 }
    );
  }
}
