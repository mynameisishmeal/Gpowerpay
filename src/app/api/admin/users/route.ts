import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/serverAuth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

/**
 * GET /api/admin/users
 * Get all users with pagination and filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { session, error } = await requireAdmin();
    if (error) return error;

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const verified = searchParams.get('verified');
    const search = searchParams.get('search');

    // Build query - show all users (not just customers)
    const query: any = {};

    if (verified === 'true') {
      query.emailVerified = true;
    } else if (verified === 'false') {
      query.emailVerified = false;
    }

    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error: any) {
    console.error('GET /api/admin/users error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
