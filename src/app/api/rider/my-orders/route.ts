import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import DeliveryPartner from '@/lib/models/DeliveryPartner';
import { populateOrdersProductNames } from '@/lib/utils/orderUtils';
import { auth } from '@/auth';

/**
 * GET /api/rider/my-orders
 * Get orders assigned to the logged-in rider with product names populated
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== 'rider') {
      return NextResponse.json(
        { error: 'Unauthorized. Riders only.' },
        { status: 401 }
      );
    }

    await connectDB();

    // Find the delivery partner record for this user
    const deliveryPartner = await DeliveryPartner.findOne({ userId: session.user.id });

    if (!deliveryPartner) {
      return NextResponse.json({ orders: [] });
    }

    // Find all orders assigned to this rider
    const orders = await Order.find({
      'assignedRider.riderId': deliveryPartner._id.toString(),
    })
      .sort({ createdAt: -1 })
      .lean();

    // Populate product names for all orders
    const ordersWithProductNames = await populateOrdersProductNames(orders);

    return NextResponse.json({ success: true, orders: ordersWithProductNames });
  } catch (error: any) {
    console.error('Error fetching rider orders:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
