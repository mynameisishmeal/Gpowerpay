import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

// GET /api/admin/auth/list - List all admin users (Super Admin only)
export async function GET(request: NextRequest) {
  try {
    // Check authentication and role
    const session = await auth();
    
    if (!session || !session.user || !session.user.role || !['sadmin', 'admin'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized. Only Super Admins and Admins can view admin users.' },
        { status: 403 }
      );
    }

    await connectDB();

    // Get all admin users (sadmin, admin, support roles)
    const adminUsers = await User.find({ 
      role: { $in: ['sadmin', 'admin', 'support'] }
    })
      .select('-password')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      users: adminUsers.map(user => ({
        ...user.toObject(),
        name: user.name || `${user.firstname || ''} ${user.lastname || ''}`.trim(),
      })),
      total: adminUsers.length,
    });
  } catch (error) {
    console.error('List admin users error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin users. Please try again.' },
      { status: 500 }
    );
  }
}

