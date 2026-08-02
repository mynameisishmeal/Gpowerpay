import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { EmailService } from '@/lib/services/emailService';

// POST /api/auth/register - Register new customer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, phonenumber } = body;

    // Validation
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    // Password strength validation
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Check if phonenumber number is already used (if provided)
    if (phonenumber) {
      const existingphonenumber = await User.findOne({ phonenumber });
      if (existingphonenumber) {
        return NextResponse.json(
          { error: 'This phonenumber number is already registered' },
          { status: 409 }
        );
      }
    }

    // Generate email verification token
    const emailVerificationToken = await EmailService.createVerificationToken(
      'temp', // Will be updated after user creation
      email.toLowerCase()
    );

    // Create new user
    const newUser = await User.create({
      email: email.toLowerCase(),
      password,
      name,
      phonenumber,
      role: 'customer',
      authProvider: 'local',
      walletBalance: 0,
      emailVerified: false,
      isActive: true,
      isBlocked: false,
    });

    // Update verification token with actual user ID
    const actualToken = await EmailService.createVerificationToken(
      String(newUser._id),
      newUser.email
    );

    // Send verification email
    await EmailService.sendVerificationEmail(newUser.email, actualToken);

    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully. Please check your email to verify your account.',
        user: {
          id: newUser._id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration error:', error);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { error: messages.join(', ') },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create account. Please try again.' },
      { status: 500 }
    );
  }
}

