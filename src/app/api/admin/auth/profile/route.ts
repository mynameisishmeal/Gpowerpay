import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

// GET /api/admin/auth/profile - Get current admin profile
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || !session.user || !session.user.role || !['sadmin', 'admin', 'support'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await connectDB();

    const adminUser = await User.findById(session.user.id)
      .select('-password');

    if (!adminUser) {
      return NextResponse.json(
        { error: 'Admin user not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        ...adminUser.toObject(),
        name: adminUser.name || `${adminUser.firstname || ''} ${adminUser.lastname || ''}`.trim(),
      },
    });
  } catch (error) {
    console.error('Get admin profile error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile. Please try again.' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/auth/profile - Update admin profile
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || !session.user || !session.user.role || !['sadmin', 'admin', 'support'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { fullName, phone, profilePicture } = body;

    await connectDB();

    const adminUser = await User.findById(session.user.id);

    if (!adminUser) {
      return NextResponse.json(
        { error: 'Admin user not found' },
        { status: 404 }
      );
    }

    // Update allowed fields - map fullName to name
    if (fullName) adminUser.name = fullName;
    if (phone !== undefined) adminUser.phonenumber = phone;
    if (profilePicture !== undefined) adminUser.profilePicture = profilePicture;

    await adminUser.save();

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: adminUser._id,
        email: adminUser.email,
        name: adminUser.name || `${adminUser.firstname || ''} ${adminUser.lastname || ''}`.trim(),
        phone: adminUser.phonenumber,
        profilePicture: adminUser.profilePicture,
        role: adminUser.role,
      },
    });
  } catch (error) {
    console.error('Update admin profile error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile. Please try again.' },
      { status: 500 }
    );
  }
}

