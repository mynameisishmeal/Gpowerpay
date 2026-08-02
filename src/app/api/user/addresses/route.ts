import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

// GET /api/user/addresses - Get all user addresses
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await connectDB();

    const user = await User.findById(session.user.id)
      .select('addresses');

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      addresses: user.addresses || [],
    });
  } catch (error) {
    console.error('Get addresses error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch addresses. Please try again.' },
      { status: 500 }
    );
  }
}

// POST /api/user/addresses - Add new address
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { street, city, state, landmark, phone, isDefault } = body;

    // Validation
    if (!street || !city || !state) {
      return NextResponse.json(
        { error: 'Street, city, and state are required' },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findById(session.user.id);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Use phone from request body, or fallback to user's profile phone
    const addressPhone = phone || user.phonenumber;

    if (!addressPhone) {
      return NextResponse.json(
        { error: 'Phone number is required. Please add a phone number to your profile first.' },
        { status: 400 }
      );
    }

    // Initialize addresses array if it doesn't exist
    if (!user.addresses) {
      user.addresses = [];
    }

    // If this is the first address or isDefault is true, set as default
    const shouldBeDefault = isDefault || user.addresses.length === 0;

    // If setting as default, unset other defaults
    if (shouldBeDefault) {
      user.addresses.forEach((addr: any) => {
        addr.isDefault = false;
      });
    }

    // Add new address
    (user.addresses as any).push({
      street,
      city,
      state,
      landmark: landmark || '',
      phone: addressPhone,
      isDefault: shouldBeDefault,
    });

    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Address added successfully',
      addresses: user.addresses,
    }, { status: 201 });
  } catch (error) {
    console.error('Add address error:', error);
    return NextResponse.json(
      { error: 'Failed to add address. Please try again.' },
      { status: 500 }
    );
  }
}

