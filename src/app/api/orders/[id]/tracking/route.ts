import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import Order from '@/models/Order';
import DeliveryPartner from '@/lib/models/DeliveryPartner';
import connectDB from '@/lib/mongodb';

/**
 * GET /api/orders/[id]/tracking
 * Get rider's current location for order tracking
 * Used by customers to track their delivery in real-time
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get order
    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Verify customer owns this order (or is admin)
    if (session.user.role !== 'admin' && order.customerId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if order has assigned rider
    if (!order.assignedRider?.riderId) {
      return NextResponse.json(
        { 
          error: 'No rider assigned yet',
          canTrack: false,
        },
        { status: 400 }
      );
    }

    // Check if order is trackable (not pending or delivered)
    const trackableStatuses = ['confirmed', 'in_transit', 'out_for_delivery'];
    if (!order.deliveryStatus || !trackableStatuses.includes(order.deliveryStatus)) {
      return NextResponse.json(
        {
          error: `Order is ${order.deliveryStatus || 'not available'}. Tracking not available.`,
          canTrack: false,
          deliveryStatus: order.deliveryStatus,
        },
        { status: 400 }
      );
    }

    // Get rider's current location
    const rider = await DeliveryPartner.findById(order.assignedRider.riderId);
    if (!rider) {
      return NextResponse.json(
        { error: 'Rider not found' },
        { status: 404 }
      );
    }

    // Check if rider is sharing location
    if (!rider.isLocationSharing || !rider.currentLocation) {
      return NextResponse.json(
        {
          error: 'Rider location not available',
          canTrack: false,
          riderInfo: {
            name: order.assignedRider.name,
            phone: order.assignedRider.phone,
            image: order.assignedRider.image,
          },
        },
        { status: 404 }
      );
    }

    // Check if location is stale (>5 minutes old)
    const locationAge = Date.now() - new Date(rider.currentLocation.lastUpdated).getTime();
    const isStale = locationAge > 5 * 60 * 1000; // 5 minutes

    // Calculate simple ETA (optional)
    let estimatedArrival = null;
    if (order.deliveryAddress && rider.currentLocation) {
      const eta = calculateSimpleETA(
        rider.currentLocation,
        order.deliveryAddress
      );
      estimatedArrival = new Date(Date.now() + eta * 60 * 1000).toISOString();
    }

    return NextResponse.json({
      success: true,
      canTrack: true,
      tracking: {
        riderLocation: {
          latitude: rider.currentLocation.latitude,
          longitude: rider.currentLocation.longitude,
          accuracy: rider.currentLocation.accuracy,
          lastUpdated: rider.currentLocation.lastUpdated,
          isStale,
        },
        deliveryAddress: {
          street: order.deliveryAddress?.street,
          city: order.deliveryAddress?.city,
          state: order.deliveryAddress?.state,
          landmark: order.deliveryAddress?.landmark,
          fullAddress: `${order.deliveryAddress?.street}, ${order.deliveryAddress?.city}, ${order.deliveryAddress?.state}`,
        },
        riderInfo: {
          name: order.assignedRider.name,
          phone: order.assignedRider.phone,
          image: order.assignedRider.image,
        },
        orderInfo: {
          orderNumber: order.orderNumber,
          deliveryStatus: order.deliveryStatus,
          deliveryDate: order.deliveryDate,
        },
        estimatedArrival,
      },
    });
  } catch (error) {
    console.error('❌ Tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to get tracking info' },
      { status: 500 }
    );
  }
}

/**
 * Calculate simple ETA based on straight-line distance
 * Assumes average speed of 20 km/h in city traffic
 */
function calculateSimpleETA(
  from: { latitude: number; longitude: number },
  to: any
): number {
  // For now, return a default ETA
  // In production, you'd want to:
  // 1. Geocode the delivery address to get coordinates
  // 2. Use Haversine formula for distance
  // 3. Or integrate with Google Maps Directions API
  
  // Default: 30 minutes
  return 30;
}

/**
 * Haversine formula to calculate distance between two points
 * Returns distance in kilometers
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}
