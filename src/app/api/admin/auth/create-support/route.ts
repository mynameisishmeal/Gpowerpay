import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import crypto from 'crypto';
import mongoose from 'mongoose';

// POST /api/admin/auth/create-support - Super Admin creates Support user
export async function POST(request: NextRequest) {
  try {
    // Check authentication and role
    const session = await auth();
    
    if (!session || !session.user || !session.user.role || !['sadmin', 'admin'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized. Only Super Admins and Admins can create Support users.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, fullName, phone, password } = body;

    // Validation
    if (!email || !fullName || !password) {
      return NextResponse.json(
        { error: 'Email, full name, and password are required' },
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

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: email.toLowerCase() });
    if (existingAdmin) {
      return NextResponse.json(
        { error: 'An admin account with this email already exists' },
        { status: 409 }
      );
    }

    // Create new Support user
    const newSupport = await User.create({
      email: email.toLowerCase(),
      password,
      name: fullName, // Map fullName to name field
      phonenumber: phone,
      role: 'support',
      isActive: true,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Support user created successfully.',
        user: {
          id: newSupport._id,
          email: newSupport.email,
          name: newSupport.name || `${newSupport.firstname || ''} ${newSupport.lastname || ''}`.trim(),
          role: newSupport.role,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create support user error:', error);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { error: messages.join(', ') },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create Support user. Please try again.' },
      { status: 500 }
    );
  }
}
