import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import Rider from '@/models/Rider';
import connectDB from '@/lib/mongodb';

/**
 * POST /api/admin/riders/reset-password
 * Admin resets a rider's password
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const session = await auth();

    // Only admin can reset passwords
    if (!session?.user?.role || !['admin', 'sadmin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { riderId, newPassword, email } = await request.json();

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    let rider;
    
    if (riderId) {
      rider = await Rider.findById(riderId);
    } else if (email) {
      rider = await Rider.findOne({ email: email.toLowerCase() });
    } else {
      return NextResponse.json(
        { error: 'Rider ID or email required' },
        { status: 400 }
      );
    }

    if (!rider) {
      return NextResponse.json({ error: 'Rider not found' }, { status: 404 });
    }

    // Update password (will be hashed by pre-save hook)
    rider.password = newPassword;
    await rider.save();

    console.log(`✅ Password reset for rider: ${rider.email}`);

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully',
      rider: {
        id: rider._id,
        email: rider.email,
        fullName: rider.fullName,
      },
    });
  } catch (error) {
    console.error('❌ Password reset error:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}
