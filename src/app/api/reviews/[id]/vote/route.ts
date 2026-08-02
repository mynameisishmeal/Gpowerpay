import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { ReviewService } from '@/lib/services/reviewService';

/**
 * POST /api/reviews/[id]/vote - Vote review as helpful/not helpful
 */
export async function POST(
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

    const { helpful } = await request.json();

    if (typeof helpful !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid vote value' },
        { status: 400 }
      );
    }

    const { id } = await params;
    await ReviewService.voteHelpful(id, session.user.id, helpful);

    return NextResponse.json({
      success: true,
      message: 'Vote recorded successfully',
    });
  } catch (error: any) {
    console.error('Vote review error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to vote on review' },
      { status: 500 }
    );
  }
}
