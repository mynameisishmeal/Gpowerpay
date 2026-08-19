import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Rider from '@/models/Rider';
import VerificationToken from '@/models/VerificationToken';
import { auth } from '@/auth';
import { EmailService } from '@/lib/services/emailService';

/**
 * POST /api/user/change-email/request-otp
 * Request an OTP to change email address.
 * If user has a password, current password is required.
 * OTP is sent to current email address to verify identity.
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
    const { newEmail, currentPassword } = body;

    if (!newEmail) {
      return NextResponse.json(
        { error: 'New email is required' },
        { status: 400 }
      );
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(newEmail)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    const normalizedEmail = newEmail.toLowerCase();

    if (normalizedEmail === session.user.email.toLowerCase()) {
      return NextResponse.json(
        { error: 'New email cannot be the same as current email' },
        { status: 400 }
      );
    }

    await connectDB();

    let user: any = null;
    let userModel: 'User' | 'Rider' = 'User';

    if (session.user.role === 'rider') {
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
      user = await User.findById(session.user.id);
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify current password if user has one
    if (user.password) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'Current password is required to change email' },
          { status: 400 }
        );
      }
      const isPasswordValid = await user.comparePassword(currentPassword);
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 401 }
        );
      }
    }

    // Check if new email is already in use
    const [existingUser, existingRider] = await Promise.all([
      User.findOne({ email: normalizedEmail }),
      Rider.findOne({ email: normalizedEmail }),
    ]);

    if (existingUser || existingRider) {
      return NextResponse.json(
        { error: 'This email is already registered' },
        { status: 409 }
      );
    }

    // Generate 6-digit OTP
    const otp = EmailService.generateNumericOTP();
    
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 mins expiry

    // Delete existing tokens of this type for this user
    await VerificationToken.deleteMany({
      userId: user._id,
      type: 'email_change_auth',
    });

    // Create new token
    await VerificationToken.create({
      userId: user._id,
      email: user.email,
      token: otp,
      type: 'email_change_auth',
      expiresAt,
    });

    // Send OTP to CURRENT email address
    await EmailService.sendEmailChangeAuthOTP(user.email, otp);

    return NextResponse.json(
      {
        success: true,
        message: 'Security code sent to your current email address.',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Request OTP error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to request security code' },
      { status: 500 }
    );
  }
}
