import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Rider from '@/models/Rider';
import { auth } from '@/auth';
import { EmailService } from '@/lib/services/emailService';

/**
 * POST /api/user/change-email
 * Change user email address (requires current password verification and sends verification to new email)
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
    const { newEmail, currentPassword } = body;

    // Validation
    if (!newEmail || !currentPassword) {
      return NextResponse.json(
        { error: 'New email and current password are required' },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(newEmail)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    // Normalize email
    const normalizedEmail = newEmail.toLowerCase();

    // Check if new email is same as current
    if (normalizedEmail === session.user.email.toLowerCase()) {
      return NextResponse.json(
        { error: 'New email cannot be the same as current email' },
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

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    // Check if new email is already in use (check both User and Rider collections)
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

    // Update email and set as unverified
    user.email = normalizedEmail;
    user.emailVerified = false;
    await user.save();

    // Send verification email to new address
    const verificationToken = await EmailService.createVerificationToken(
      String(user._id),
      normalizedEmail
    );
    await EmailService.sendVerificationEmail(normalizedEmail, verificationToken);

    return NextResponse.json(
      {
        success: true,
        message: 'Email updated successfully. Please check your new email to verify it.',
        newEmail: normalizedEmail,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Change email error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to change email' },
      { status: 500 }
    );
  }
}
