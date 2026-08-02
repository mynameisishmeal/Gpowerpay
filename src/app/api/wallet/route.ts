import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { WalletService } from '@/lib/services/walletService';

/**
 * GET /api/wallet - Get wallet details
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const walletDetails = await WalletService.getWalletDetails(session.user.id);

    return NextResponse.json({
      success: true,
      wallet: walletDetails,
    });
  } catch (error: any) {
    console.error('Get wallet error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get wallet details' },
      { status: 500 }
    );
  }
}
