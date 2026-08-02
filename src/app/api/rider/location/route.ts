import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import DeliveryPartner from '@/lib/models/DeliveryPartner';
import connectDB from '@/lib/mongodb';

/**
 * POST /api/rider/location
 * Rider updates their current location during delivery
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'rider') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { latitude, longitude, accuracy } = await request.json();

    // Validate coordinates
    if (!latitude || !longitude || 
        latitude < -90 || latitude > 90 || 
        longitude < -180 || longitude > 180) {
      return NextResponse.json(
        { error: 'Invalid coordinates' },
        { status: 400 }
      );
    }

    // Find rider by userId
    const rider = await DeliveryPartner.findOne({ userId: session.user.id });
    if (!rider) {
      return NextResponse.json({ error: 'Rider not found' }, { status: 404 });
    }

    // Update rider location
    rider.currentLocation = {
      latitude,
      longitude,
      accuracy: accuracy || 0,
      lastUpdated: new Date(),
    };
    rider.isLocationSharing = true;

    await rider.save();

    return NextResponse.json({ 
      success: true,
      message: 'Location updated successfully',
    });
  } catch (error) {
    console.error('❌ Location update error:', error);
    return NextResponse.json(
      { error: 'Failed to update location' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/rider/location
 * Rider stops sharing location
 */
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'rider') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rider = await DeliveryPartner.findOne({ userId: session.user.id });
    if (!rider) {
      return NextResponse.json({ error: 'Rider not found' }, { status: 404 });
    }

    rider.isLocationSharing = false;
    await rider.save();

    return NextResponse.json({ 
      success: true,
      message: 'Location sharing stopped',
    });
  } catch (error) {
    console.error('❌ Stop location sharing error:', error);
    return NextResponse.json(
      { error: 'Failed to stop location sharing' },
      { status: 500 }
    );
  }
}
