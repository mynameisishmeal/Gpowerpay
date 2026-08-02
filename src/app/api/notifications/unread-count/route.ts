import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { NotificationService } from '@/lib/services/notificationService';

/**
 * GET /api/notifications/unread-count - Get unread notification count
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ count: 0 });
    }

    const count = await NotificationService.getUnreadCount(session.user.id);

    return NextResponse.json({
      success: true,
      count,
    });
  } catch (error: any) {
    console.error('Get unread count error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get unread count' },
      { status: 500 }
    );
  }
}
