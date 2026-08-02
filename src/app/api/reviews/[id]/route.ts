import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { ReviewService } from '@/lib/services/reviewService';

/**
 * PUT /api/reviews/[id] - Update a review
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id } = await params;

    const review = await ReviewService.updateReview(
      id,
      session.user.id,
      {
        rating: body.rating,
        title: body.title,
        comment: body.comment,
        images: body.images,
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Review updated successfully',
      review,
    });
  } catch (error: any) {
    console.error('Update review error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update review' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/reviews/[id] - Delete a review
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    await ReviewService.deleteReview(id, session.user.id);

    return NextResponse.json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete review error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete review' },
      { status: 500 }
    );
  }
}
