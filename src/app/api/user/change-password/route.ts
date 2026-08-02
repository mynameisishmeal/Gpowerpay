import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Rider from '@/models/Rider';
import { auth } from '@/auth';

/**
 * POST /api/user/change-password
 * Change user password (requires email verification and current password)
 * Works for all user types: customers, admins, riders
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'New passwords do not match' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: 'New password must be different from current password' },
        { status: 400 }
      );
    }

    await connectDB();

    // Determine user type and fetch user
    let user: any = null;
    let userModel: 'User' | 'Rider' = 'User';

    if (session.user.role === 'rider') {
      // Check both User and Rider collections for riders
      const riderUser = await User.findById(session.user.id);
      if (riderUser) {
        user = riderUser;
        userModel = 'User';
      } else {
        const riderAccount = await Rider.findById(session.user.id);
        if (riderAccount) {
          user = riderAccount;
          userModel = 'Rider';
        }
      }
    } else {
      // Customer, admin, support users
      user = await User.findById(session.user.id);
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if email is verified (MANDATORY)
    if (!user.emailVerified) {
      return NextResponse.json(
        { 
          error: 'Email verification required. Please verify your email before changing your password.',
          code: 'EMAIL_NOT_VERIFIED'
        },
        { status: 403 }
      );
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    // Update password
    user.password = newPassword;
    await user.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Password changed successfully. Please sign in with your new password.',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to change password' },
      { status: 500 }
    );
  }
}
