import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { WishlistService } from '@/lib/services/wishlistService';

/**
 * GET /api/wishlist
 * Get user's wishlist
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const wishlist = await WishlistService.getWishlist(session.user.id);

    return NextResponse.json({
      success: true,
      wishlist,
      count: wishlist.items.length,
    });
  } catch (error: any) {
    console.error('GET /api/wishlist error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch wishlist' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/wishlist
 * Add item to wishlist
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { productId, marketType = 'kilo' } = body;

    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const wishlist = await WishlistService.addToWishlist({
      userId: session.user.id,
      customerEmail: session.user.email!,
      productId,
      marketType,
    });

    return NextResponse.json({
      success: true,
      message: 'Added to wishlist',
      wishlist,
    });
  } catch (error: any) {
    console.error('POST /api/wishlist error:', error);
    
    if (error.message === 'Product already in wishlist') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to add to wishlist' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/wishlist
 * Remove item from wishlist or clear all
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const marketType = (searchParams.get('marketType') as 'kilo' | 'carton') || 'kilo';
    const clearAll = searchParams.get('clearAll') === 'true';

    let wishlist;

    if (clearAll) {
      wishlist = await WishlistService.clearWishlist(session.user.id);
    } else if (productId) {
      wishlist = await WishlistService.removeFromWishlist(session.user.id, productId, marketType);
    } else {
      return NextResponse.json(
        { success: false, error: 'Product ID or clearAll parameter is required' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: clearAll ? 'Wishlist cleared' : 'Removed from wishlist',
      wishlist,
    });
  } catch (error: any) {
    console.error('DELETE /api/wishlist error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to remove from wishlist' },
      { status: 500 }
    );
  }
}
