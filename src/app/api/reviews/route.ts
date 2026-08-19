import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { ReviewService } from '@/lib/services/reviewService';

/**
 * GET /api/reviews - Get product reviews
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sort = searchParams.get('sort') as any || 'recent';

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const result = await ReviewService.getProductReviews(
      productId,
      page,
      limit,
      sort
    );

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('Get reviews error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get reviews' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reviews - Create a review
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate input - only productId and rating are required
    if (!body.productId || !body.rating) {
      return NextResponse.json(
        { error: 'Product ID and rating are required' },
        { status: 400 }
      );
    }

    if (body.rating < 1 || body.rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    const review = await ReviewService.createReview({
      productId: body.productId,
      customerId: session.user.id,
      customerName: session.user.name || 'Customer',
      rating: body.rating,
      title: body.title?.trim() || '',
      comment: body.comment?.trim() || '',
      images: body.images || [],
    });

    return NextResponse.json({
      success: true,
      message: 'Review submitted successfully',
      review,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create review error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create review' },
      { status: 500 }
    );
  }
}
