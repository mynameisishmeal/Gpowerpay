import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

// PUT /api/user/addresses/[addressId] - Update specific address
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ addressId: string }> }
) {
  try {
    const session = await auth();
    
    if (!session || !session.user || !session.user.role || session.user.role !== 'customer') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { addressId } = await params;
    const body = await request.json();
    const { label, fullAddress, street, city, state, postalCode, country, isDefault } = body;

    await connectDB();

    const user = await User.findById(session.user.id);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const address = (user.addresses as any).id(addressId);

    if (!address) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      );
    }

    // Update address fields
    if (label) address.label = label;
    if (fullAddress) address.fullAddress = fullAddress;
    if (street !== undefined) address.street = street;
    if (city) address.city = city;
    if (state) address.state = state;
    if (postalCode !== undefined) address.postalCode = postalCode;
    if (country) address.country = country;

    // Handle default address
    if (isDefault === true) {
      if (user.addresses) {
        user.addresses.forEach((addr: any) => {
          addr.isDefault = false;
        });
      }
      address.isDefault = true;
    } else if (isDefault === false && address.isDefault) {
      // Prevent removing default if it's the only address
      if (user.addresses && user.addresses.length === 1) {
        return NextResponse.json(
          { error: 'Cannot remove default from the only address' },
          { status: 400 }
        );
      }
      address.isDefault = false;
    }

    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Address updated successfully',
      addresses: user.addresses,
    });
  } catch (error) {
    console.error('Update address error:', error);
    return NextResponse.json(
      { error: 'Failed to update address. Please try again.' },
      { status: 500 }
    );
  }
}

// DELETE /api/user/addresses/[addressId] - Delete specific address
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ addressId: string }> }
) {
  try {
    const session = await auth();
    
    if (!session || !session.user || !session.user.role || session.user.role !== 'customer') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { addressId } = await params;

    await connectDB();

    const user = await User.findById(session.user.id);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.addresses) {
      return NextResponse.json(
        { error: 'No addresses found' },
        { status: 404 }
      );
    }

    const address = (user.addresses as any).id(addressId);

    if (!address) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      );
    }

    const wasDefault = address.isDefault;

    // Remove the address
    address.deleteOne();

    // If deleted address was default, set first remaining address as default
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Address deleted successfully',
      addresses: user.addresses,
    });
  } catch (error) {
    console.error('Delete address error:', error);
    return NextResponse.json(
      { error: 'Failed to delete address. Please try again.' },
      { status: 500 }
    );
  }
}
