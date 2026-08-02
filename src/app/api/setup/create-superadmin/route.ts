import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { EmailService } from '@/lib/services/emailService';

/**
 * GET/POST /api/setup/create-superadmin
 * Create or update super admin account with email verification
 * 
 * SECURITY: This should be disabled in production or protected with a setup token
 */

async function createSuperAdminAccount() {
  try {
    await connectDB();

    const email = 'mighty@gpower.biz';
    const password = 'Mighty';
    const name = 'Mighty Admin';

    // Check if super admin already exists
    const existingAdmin = await User.findOne({ email });

    if (existingAdmin) {
      // Update existing admin to super admin
      existingAdmin.role = 'sadmin';
      existingAdmin.emailVerified = false; // Set to false to trigger verification
      existingAdmin.isActive = true;
      existingAdmin.isBlocked = false;
      existingAdmin.name = name;
      existingAdmin.password = password; // Will be hashed by pre-save hook
      await existingAdmin.save();

      // Send verification email
      const verificationToken = await EmailService.createVerificationToken(
        String(existingAdmin._id),
        existingAdmin.email
      );
      await EmailService.sendVerificationEmail(existingAdmin.email, verificationToken);

      return NextResponse.json(
        {
          success: true,
          message: 'Super admin account updated successfully. Verification email sent!',
          admin: {
            email: existingAdmin.email,
            name: existingAdmin.name,
            role: existingAdmin.role,
            emailVerified: existingAdmin.emailVerified,
          },
          credentials: {
            email: 'mighty@gpower.biz',
            password: 'Mighty',
            note: 'Please check your email to verify your account before logging in',
          },
        },
        { status: 200 }
      );
    }

    // Create new super admin (unverified)
    const superAdmin = await User.create({
      email,
      password, // Will be hashed by pre-save hook
      name,
      role: 'sadmin',
      emailVerified: false, // Not verified yet
      isActive: true,
      isBlocked: false,
      walletBalance: 0,
    });

    // Send verification email
    const verificationToken = await EmailService.createVerificationToken(
      String(superAdmin._id),
      superAdmin.email
    );
    await EmailService.sendVerificationEmail(superAdmin.email, verificationToken);

    return NextResponse.json(
      {
        success: true,
        message: 'Super admin account created successfully. Verification email sent!',
        admin: {
          email: superAdmin.email,
          name: superAdmin.name,
          role: superAdmin.role,
          emailVerified: superAdmin.emailVerified,
        },
        credentials: {
          email: 'mighty@gpower.biz',
          password: 'Mighty',
          note: 'Please check your email (or console logs) to verify your account before logging in',
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating super admin:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create super admin' },
      { status: 500 }
    );
  }
}

// POST handler
export async function POST(request: NextRequest) {
  return createSuperAdminAccount();
}

// GET handler (for easy browser access)
export async function GET(request: NextRequest) {
  return createSuperAdminAccount();
}
