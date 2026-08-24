import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/serverAuth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { session, error } = await requireAdmin();
    if (error) return error;

    if (!session?.user || session.user.role !== 'sadmin') {
      return NextResponse.json(
        { success: false, error: 'Only Super Admin can perform this action' },
        { status: 403 }
      );
    }

    const userId = id;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const result = await User.updateOne(
      { _id: userId },
      { $set: { emailVerified: true } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Email activated successfully',
    });
  } catch (error: any) {
    console.error('PUT /api/admin/users/[id]/activate-email error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to activate email' },
      { status: 500 }
    );
  }
}
