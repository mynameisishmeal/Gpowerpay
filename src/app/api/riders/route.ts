import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import DeliveryPartner from '@/lib/models/DeliveryPartner';
import { requireAdmin } from '@/lib/serverAuth';

/**
 * GET /api/riders - Get all delivery partners (with optional filters)
 * Query params: partnerType, isActive
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const partnerType = searchParams.get('riderType'); // 'bulk' or 'small' (keeping riderType for compatibility)
    const isActive = searchParams.get('status') === 'active'; // Convert 'active' to true

    const filter: any = {};
    if (partnerType) filter.partnerType = partnerType;
    if (searchParams.get('status')) filter.isActive = isActive;

    const partners = await DeliveryPartner.find(filter).sort({ createdAt: -1 });

    // Map response to match expected frontend format
    const riders = partners.map(partner => ({
      _id: partner._id,
      name: partner.name,
      email: partner.email,
      phone: partner.phone,
      riderType: partner.partnerType, // Map partnerType to riderType for frontend
      partnerType: partner.partnerType,
      status: partner.isActive ? 'active' : 'inactive', // Map isActive to status
      isActive: partner.isActive,
      image: partner.image,
      createdAt: partner.createdAt,
      updatedAt: partner.updatedAt,
    }));

    return NextResponse.json({ riders }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching delivery partners:', error);
    return NextResponse.json(
      { error: 'Failed to fetch delivery partners' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/riders - Create a new delivery partner (Admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const { error } = await requireAdmin();
    if (error) return error;

    await connectDB();

    const body = await request.json();
    const { name, email, phone, password, riderType, status, image } = body;

    // Validation
    if (!name || !email || !phone || !password || !riderType) {
      return NextResponse.json(
        { error: 'Name, email, phone, password, and rider type are required' },
        { status: 400 }
      );
    }

    if (!['bulk', 'small'].includes(riderType)) {
      return NextResponse.json(
        { error: 'Rider type must be either "bulk" or "small"' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const User = (await import('@/models/User')).default;
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const bcrypt = (await import('bcryptjs')).default;
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create User account with rider role
    const user = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      firstname: name.split(' ')[0],
      lastname: name.split(' ').slice(1).join(' ') || '',
      phonenumber: phone,
      role: 'rider',
      emailVerified: true, // Auto-verify for admin-created accounts
    });

    // Create delivery partner linked to user
    const rider = await DeliveryPartner.create({
      name,
      email: email.toLowerCase(),
      phone,
      userId: user._id,
      partnerType: riderType, // Map riderType to partnerType
      isActive: status === 'active', // Map 'active'/'inactive' to boolean
      image: image || null,
    });

    return NextResponse.json(
      { message: 'Delivery partner created successfully', rider },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating delivery partner:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create delivery partner' },
      { status: 500 }
    );
  }
}
