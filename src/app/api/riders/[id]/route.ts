import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import DeliveryPartner from '@/lib/models/DeliveryPartner';
import { requireAdmin } from '@/lib/serverAuth';

/**
 * GET /api/riders/[id] - Get a single delivery partner
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    const rider = await DeliveryPartner.findById(id);
    if (!rider) {
      return NextResponse.json({ error: 'Delivery partner not found' }, { status: 404 });
    }

    return NextResponse.json({ rider }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching delivery partner:', error);
    return NextResponse.json(
      { error: 'Failed to fetch delivery partner' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/riders/[id] - Update a delivery partner (Admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Verify admin authentication
    const { error } = await requireAdmin();
    if (error) return error;

    await connectDB();

    const body = await request.json();
    const { name, email, phone, password, riderType, status, image } = body;

    // Validation
    if (riderType && !['bulk', 'small'].includes(riderType)) {
      return NextResponse.json(
        { error: 'Rider type must be either "bulk" or "small"' },
        { status: 400 }
      );
    }

    // Update delivery partner
    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email.toLowerCase();
    if (phone) updateData.phone = phone;
    if (riderType) updateData.partnerType = riderType;
    if (status) updateData.isActive = status === 'active';
    if (image !== undefined) updateData.image = image;

    const rider = await DeliveryPartner.findByIdAndUpdate(id, updateData, {
      returnDocument: 'after',
      runValidators: true,
    });

    if (!rider) {
      return NextResponse.json({ error: 'Delivery partner not found' }, { status: 404 });
    }

    const User = (await import('@/models/User')).default;

    // If rider doesn't have a User account yet and email/password provided, create one
    if (!rider.userId && email && password) {
      const bcrypt = (await import('bcryptjs')).default;
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await User.create({
        email: email.toLowerCase(),
        password: hashedPassword,
        name: name || rider.name,
        firstname: (name || rider.name).split(' ')[0],
        lastname: (name || rider.name).split(' ').slice(1).join(' ') || '',
        phonenumber: phone || rider.phone,
        role: 'rider',
        emailVerified: true,
      });

      // Link user to rider
      rider.userId = user._id;
      await rider.save();

      return NextResponse.json(
        { message: 'Delivery partner updated and user account created', rider },
        { status: 200 }
      );
    }

    // Update associated User account if exists
    if (rider.userId && (name || email || password)) {
      const userUpdateData: any = {};
      
      if (name) {
        userUpdateData.name = name;
        userUpdateData.firstname = name.split(' ')[0];
        userUpdateData.lastname = name.split(' ').slice(1).join(' ') || '';
      }
      if (email) userUpdateData.email = email.toLowerCase();
      if (phone) userUpdateData.phonenumber = phone;
      
      if (password) {
        const bcrypt = (await import('bcryptjs')).default;
        userUpdateData.password = await bcrypt.hash(password, 10);
      }

      await User.findByIdAndUpdate(rider.userId, userUpdateData);
    }

    return NextResponse.json(
      { message: 'Delivery partner updated successfully', rider },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating delivery partner:', error);
    
    // Handle duplicate email error
    if (error.code === 11000 && error.keyPattern?.email) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to update delivery partner' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/riders/[id] - Delete a delivery partner (Admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Verify admin authentication
    const { error } = await requireAdmin();
    if (error) return error;

    await connectDB();

    const rider = await DeliveryPartner.findByIdAndDelete(id);
    if (!rider) {
      return NextResponse.json({ error: 'Delivery partner not found' }, { status: 404 });
    }

    return NextResponse.json(
      { message: 'Delivery partner deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error deleting delivery partner:', error);
    return NextResponse.json(
      { error: 'Failed to delete delivery partner' },
      { status: 500 }
    );
  }
}
