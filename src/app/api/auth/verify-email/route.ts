import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/lib/services/emailService';

/**
 * POST /api/auth/verify-email
 * Verify email with token
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Verification token is required' },
        { status: 400 }
      );
    }

    const user = await EmailService.verifyEmail(token);

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
      user: {
        email: user.email,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error: any) {
    console.error('POST /api/auth/verify-email error:', error);
    
    const statusCode = error.message.includes('expired') ? 410 : 400;
    
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to verify email' },
      { status: statusCode }
    );
  }
}
