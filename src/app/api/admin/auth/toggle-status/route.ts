import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

// POST /api/admin/auth/toggle-status - Activate/deactivate Support user
export async function POST(request: NextRequest) {
  try {
    // Check authentication and role
    const session = await auth();
    
    if (!session || !session.user || !session.user.role || session.user.role !== 'sadmin') {
      return NextResponse.json(
        { error: 'Unauthorized. Only Super Admins can manage user status.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, isActive } = body;

    if (!userId || typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'User ID and status are required' },
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

    // Cannot deactivate Super Admins
    if (adminUser.role === 'sadmin') {
      return NextResponse.json(
        { error: 'Cannot change Super Admin status' },
        { status: 403 }
      );
    }

    // Update status
    adminUser.isActive = isActive;
    await adminUser.save();

    const action = isActive ? 'activated' : 'deactivated';

    return NextResponse.json({
      success: true,
      message: `Support user ${action} successfully.`,
      user: {
        id: adminUser._id,
        email: adminUser.email,
        name: adminUser.name || `${adminUser.firstname || ''} ${adminUser.lastname || ''}`.trim(),
        isActive: adminUser.isActive,
      },
    });
  } catch (error) {
    console.error('Toggle status error:', error);
    return NextResponse.json(
      { error: 'Failed to update user status. Please try again.' },
      { status: 500 }
    );
  }
}

