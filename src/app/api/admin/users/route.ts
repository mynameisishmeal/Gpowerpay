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

/**
 * POST /api/admin/users
 * Create a new user (customer, admin, or sadmin)
 */
export async function POST(request: NextRequest) {
  try {
    const { session, error } = await requireAdmin();
    if (error) return error;

    const data = await request.json();
    const { name, email, phone, password, role, status } = data;

    // Validate required fields
    if (!name || !email || !password || !role || !status) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Role security check
    // Only 'sadmin' can create 'admin' or 'sadmin'
    const currentUserRole = session?.user?.role;
    if ((role === 'admin' || role === 'sadmin') && currentUserRole !== 'sadmin') {
      return NextResponse.json(
        { success: false, error: 'Only Super Admins can create admin users' },
        { status: 403 }
      );
    }

    await connectDB();

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email already exists' },
        { status: 400 }
      );
    }

    // Prepare names (GpowerCRM legacy fields)
    const nameParts = name.trim().split(' ');
    const firstname = nameParts[0];
    const lastname = nameParts.slice(1).join(' ');

    const newUser = new User({
      name,
      firstname,
      lastname,
      email: email.toLowerCase(),
      password,
      phonenumber: phone || '',
      role,
      isActive: status === 'active',
      emailVerified: true, // Auto verify since admin created it
      authProvider: 'local',
      walletBalance: 0,
      isBlocked: false,
    });

    await newUser.save();

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
    });
  } catch (err: any) {
    console.error('POST /api/admin/users error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to create user' },
      { status: 500 }
    );
  }
}
