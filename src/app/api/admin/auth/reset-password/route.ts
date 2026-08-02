import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

// POST /api/admin/auth/reset-password - Reset admin/support password (by Super Admin)
export async function POST(request: NextRequest) {
  try {
    // Check authentication and role
    const session = await auth();
    
    if (!session || !session.user || !session.user.role || session.user.role !== 'sadmin') {
      return NextResponse.json(
        { error: 'Unauthorized. Only Super Admins can reset passwords.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, newPassword } = body;

    if (!userId || !newPassword) {
      return NextResponse.json(
        { error: 'User ID and new password are required' },
        { status: 400 }
      );
    }

    // Password validation
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    await connectDB();

    const adminUser = await User.findById(userId);

    if (!adminUser) {
      return NextResponse.json(
        { error: 'Admin user not found' },
        { status: 404 }
      );
    }

    // Prevent resetting Super Admin password by another Super Admin
    if (adminUser.role === 'sadmin' && adminUser._id.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'Cannot reset another Super Admin\'s password' },
        { status: 403 }
      );
    }

    // Update password
    adminUser.password = newPassword;
    await adminUser.save();

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully.',
    });
  } catch (error) {
    console.error('Admin password reset error:', error);
    return NextResponse.json(
      { error: 'Failed to reset password. Please try again.' },
      { status: 500 }
    );
  }
}

