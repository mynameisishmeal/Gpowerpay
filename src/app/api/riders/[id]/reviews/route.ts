import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import RiderReview from '@/models/RiderReview';
import connectDB from '@/lib/mongodb';

/**
 * GET /api/riders/[id]/reviews
 * Get all reviews for a rider (public + admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const session = await auth();
    const { id: riderId } = await params;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Get public reviews only (riders should not see their own reviews)
    const [reviews, total, stats] = await Promise.all([
      RiderReview.find({ riderId, isPublic: true })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      RiderReview.countDocuments({ riderId, isPublic: true }),
      RiderReview.getAverageRating(riderId),
    ]);

    return NextResponse.json({
      success: true,
      reviews,
      statistics: {
        averageRating: parseFloat(stats.averageRating.toFixed(1)),
        totalReviews: stats.totalReviews,
        breakdown: {
          punctuality: parseFloat((stats.averagePunctuality || 0).toFixed(1)),
          professionalism: parseFloat((stats.averageProfessionalism || 0).toFixed(1)),
          communication: parseFloat((stats.averageCommunication || 0).toFixed(1)),
        },
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get rider reviews error:', error);
    return NextResponse.json(
      { error: 'Failed to get reviews' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/riders/[id]/reviews
 * Create a review for a rider (customer only, after delivery)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const session = await auth();

    if (!session?.user || session.user.role !== 'customer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: riderId } = await params;
    const body = await request.json();

    const { orderId, rating, comment, punctuality, professionalism, communication } = body;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Check if order exists and was delivered by this rider
    const Order = (await import('@/models/Order')).default;
    const order = await Order.findOne({
      _id: orderId,
      customerId: session.user.id,
      'assignedRider.riderId': riderId,
      deliveryStatus: 'delivered',
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found or not delivered by this rider' },
        { status: 404 }
      );
    }

    // Check if review already exists
    const existingReview = await RiderReview.findOne({ orderId });
    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this delivery' },
        { status: 400 }
      );
    }

    // Create review
    const review = await RiderReview.create({
      riderId,
      customerId: session.user.id,
      orderId,
      rating,
      comment: comment?.trim(),
      customerName: session.user.name || 'Anonymous',
      punctuality,
      professionalism,
      communication,
      isPublic: true,
      isVerified: true,
    });

    // Update rider's average rating
    const DeliveryPartner = (await import('@/lib/models/DeliveryPartner')).default;
    const stats = await RiderReview.getAverageRating(riderId);
    await DeliveryPartner.findByIdAndUpdate(riderId, {
      averageRating: stats.averageRating,
      totalReviews: stats.totalReviews,
    });

    return NextResponse.json({
      success: true,
      message: 'Review submitted successfully',
      review,
    });
  } catch (error) {
    console.error('Create rider review error:', error);
    return NextResponse.json(
      { error: 'Failed to submit review' },
      { status: 500 }
    );
  }
}
