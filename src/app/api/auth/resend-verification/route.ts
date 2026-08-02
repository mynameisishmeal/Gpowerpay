import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { EmailService } from '@/lib/services/emailService';

/**
 * POST /api/auth/resend-verification
 * Resend verification email
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await EmailService.resendVerificationEmail(session.user.email);

    return NextResponse.json({
      success: true,
      message: 'Verification email sent successfully',
    });
  } catch (error: any) {
    console.error('POST /api/auth/resend-verification error:', error);
    
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to resend verification email' },
      { status: 500 }
    );
  }
}
